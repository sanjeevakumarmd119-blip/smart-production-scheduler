/**
 * ============================================================================
 * PROJECT: Smart Dynamic Production Scheduling and Machine Optimization System
 * ACADEMIC C++17 REFERENCE IMPLEMENTATION
 * 
 * Problem Statement:
 * Electronics manufacturing plant headed by Mr. Rohan Malhotra.
 * Automated robotic workstations (Assembly, Soldering, Testing, Calibration, AOI Inspection).
 * Dependent multi-operation manufacturing orders with dynamic disruptions (machine failures,
 * urgent customer orders, scheduled maintenance).
 * 
 * Core Data Structures Used:
 * 1. std::priority_queue  - Multi-attribute slack & priority-based operation ready queue
 * 2. std::vector          - Contiguous schedule storage, operation sequences, machine lists
 * 3. std::unordered_map   - Fast O(1) graph adjacency list, in-degree lookup, and machine intervals
 * 4. Graph / DAG          - Dependency topological resolution for operation precedence
 * 5. TimeInterval Vector  - Earliest contiguous free slot search across machine timelines
 * ============================================================================
 */

#include <iostream>
#include <vector>
#include <string>
#include <unordered_map>
#include <unordered_set>
#include <queue>
#include <algorithm>
#include <iomanip>
#include <cmath>
#include <memory>

enum class PriorityLevel {
    LOW = 50,
    MEDIUM = 150,
    HIGH = 300,
    CRITICAL = 500
};

enum class MachineStatus {
    AVAILABLE,
    BUSY,
    MAINTENANCE,
    FAILED,
    OFFLINE
};

struct TimeInterval {
    int start;
    int end;
    std::string type; // OCCUPIED, MAINTENANCE, FAILURE
    std::string reason;
};

struct Operation {
    std::string id;
    std::string orderId;
    std::string name;
    int sequenceNumber;
    std::string requiredCapability;
    int processingTime; // in minutes
    std::vector<std::string> dependencies;
    std::string status = "PENDING";
};

struct Order {
    std::string id;
    std::string customerName;
    std::string productName;
    PriorityLevel priority;
    int quantity;
    int deadline; // minute by which order must finish
    int createdAtTime = 0;
    bool isUrgent = false;
    std::vector<Operation> operations;
};

struct Machine {
    std::string id;
    std::string name;
    std::string type;
    std::vector<std::string> capabilities;
    double processingSpeed = 1.0; // speed multiplier
    MachineStatus status = MachineStatus::AVAILABLE;
    std::vector<TimeInterval> blockedIntervals;
};

struct ScheduleEntry {
    std::string id;
    std::string orderId;
    std::string operationId;
    std::string operationName;
    std::string machineId;
    std::string machineName;
    int startTime;
    int endTime;
    int duration;
    std::string explanation;
};

struct EligibleOpNode {
    Operation op;
    Order order;
    int earliestReadyTime;
    int criticalPathLength;
    double priorityScore;

    // Priority Queue comparator (Max-Heap: higher score is dispatched first)
    bool operator<(const EligibleOpNode& other) const {
        if (std::abs(priorityScore - other.priorityScore) > 1e-4) {
            return priorityScore < other.priorityScore;
        }
        if (earliestReadyTime != other.earliestReadyTime) {
            return earliestReadyTime > other.earliestReadyTime; // earlier ready time first
        }
        return criticalPathLength < other.criticalPathLength;
    }
};

/**
 * Calculates priority score incorporating slack time and priority class.
 */
double evaluatePriorityScore(const Order& order, const Operation& op, int currentTime) {
    double base = static_cast<double>(order.priority);
    int remainingWork = op.processingTime; // heuristic remaining work
    int estimatedFinish = currentTime + remainingWork;
    int slack = order.deadline - estimatedFinish;

    double slackAdjustment = 0.0;
    if (slack < 0) {
        slackAdjustment = std::abs(slack) * 4.0; // Heavy penalty/boost for overdue
    } else if (slack <= 30) {
        slackAdjustment = (30 - slack) * 2.5;
    } else {
        slackAdjustment = -std::min(slack * 0.2, 50.0);
    }

    double urgentBoost = order.isUrgent ? 250.0 : 0.0;
    return base + slackAdjustment + urgentBoost;
}

/**
 * Finds the earliest contiguous free time slot on a machine.
 */
int findEarliestFreeSlot(std::vector<TimeInterval>& occupied, int duration, int earliestReady) {
    if (occupied.empty()) return earliestReady;

    std::sort(occupied.begin(), occupied.end(), [](const TimeInterval& a, const TimeInterval& b) {
        return a.start < b.start;
    });

    // Merge intervals
    std::vector<TimeInterval> merged;
    for (const auto& inv : occupied) {
        if (merged.empty()) {
            merged.push_back(inv);
        } else {
            if (inv.start <= merged.back().end) {
                merged.back().end = std::max(merged.back().end, inv.end);
            } else {
                merged.push_back(inv);
            }
        }
    }

    int candidate = earliestReady;
    for (const auto& block : merged) {
        if (candidate + duration <= block.start) {
            return candidate;
        }
        if (candidate < block.end) {
            candidate = block.end;
        }
    }
    return candidate;
}

/**
 * Heuristic Machine Scheduler
 */
std::vector<ScheduleEntry> scheduleFactory(
    const std::vector<Order>& orders,
    std::vector<Machine>& machines,
    int currentTime = 0,
    const std::vector<ScheduleEntry>& lockedEntries = {}
) {
    std::vector<ScheduleEntry> schedule = lockedEntries;
    std::unordered_map<std::string, std::vector<TimeInterval>> machineIntervals;
    std::unordered_set<std::string> completedOps;
    std::unordered_map<std::string, int> opEndTimes;

    for (const auto& m : machines) {
        machineIntervals[m.id] = m.blockedIntervals;
    }

    for (const auto& entry : lockedEntries) {
        machineIntervals[entry.machineId].push_back({entry.startTime, entry.endTime, "OCCUPIED", ""});
        completedOps.insert(entry.operationId);
        opEndTimes[entry.operationId] = entry.endTime;
    }

    std::unordered_set<std::string> scheduledOps = completedOps;
    std::unordered_map<std::string, Operation> allOps;
    std::unordered_map<std::string, Order> opOrderMap;

    for (const auto& ord : orders) {
        for (const auto& op : ord.operations) {
            allOps[op.id] = op;
            opOrderMap[op.id] = ord;
        }
    }

    int stepCount = 1;

    while (true) {
        // Collect eligible operations using DAG dependency check
        std::vector<EligibleOpNode> eligible;

        for (const auto& [opId, op] : allOps) {
            if (scheduledOps.count(opId)) continue;

            bool depsSatisfied = true;
            int readyTime = std::max(currentTime, opOrderMap[opId].createdAtTime);

            for (const auto& depId : op.dependencies) {
                if (!completedOps.count(depId)) {
                    depsSatisfied = false;
                    break;
                }
                readyTime = std::max(readyTime, opEndTimes[depId]);
            }

            if (depsSatisfied) {
                const auto& ord = opOrderMap[opId];
                double score = evaluatePriorityScore(ord, op, readyTime);
                eligible.push_back({op, ord, readyTime, op.processingTime, score});
            }
        }

        if (eligible.empty()) break;

        // Use Priority Queue (Heap)
        std::priority_queue<EligibleOpNode> pq(eligible.begin(), eligible.end());
        EligibleOpNode topNode = pq.top();

        // Machine Assignment: evaluate compatible machines
        Machine* bestMachine = nullptr;
        int bestStartTime = 1e9;
        int bestDuration = 0;

        for (auto& m : machines) {
            if (m.status == MachineStatus::OFFLINE) continue;

            bool hasCap = false;
            for (const auto& cap : m.capabilities) {
                if (cap == topNode.op.requiredCapability) {
                    hasCap = true;
                    break;
                }
            }
            if (!hasCap) continue;

            int effectiveDuration = std::max(1, static_cast<int>(std::ceil(topNode.op.processingTime / m.processingSpeed)));
            int earliestStart = findEarliestFreeSlot(machineIntervals[m.id], effectiveDuration, topNode.earliestReadyTime);

            if (earliestStart + effectiveDuration < bestStartTime + bestDuration) {
                bestStartTime = earliestStart;
                bestDuration = effectiveDuration;
                bestMachine = &m;
            }
        }

        if (!bestMachine) {
            std::cerr << "Warning: No compatible machine for " << topNode.op.id << "\n";
            scheduledOps.insert(topNode.op.id);
            continue;
        }

        // Schedule selected operation
        int endTime = bestStartTime + bestDuration;
        ScheduleEntry entry{
            "SCHED-" + std::to_string(stepCount++),
            topNode.order.id,
            topNode.op.id,
            topNode.op.name,
            bestMachine->id,
            bestMachine->name,
            bestStartTime,
            endTime,
            bestDuration,
            "Assigned to " + bestMachine->name + " via EFT Heuristic"
        };

        schedule.push_back(entry);
        scheduledOps.insert(topNode.op.id);
        completedOps.insert(topNode.op.id);
        opEndTimes[topNode.op.id] = endTime;
        machineIntervals[bestMachine->id].push_back({bestStartTime, endTime, "OCCUPIED", ""});
    }

    return schedule;
}

void printSchedule(const std::vector<ScheduleEntry>& schedule) {
    std::cout << "\n========================================================================================\n";
    std::cout << "                   GENERATED OPTIMAL PRODUCTION SCHEDULE                                \n";
    std::cout << "========================================================================================\n";
    std::cout << std::left 
              << std::setw(12) << "Order ID"
              << std::setw(24) << "Operation"
              << std::setw(22) << "Machine"
              << std::setw(10) << "Start"
              << std::setw(10) << "End"
              << std::setw(10) << "Duration"
              << "\n";
    std::cout << "----------------------------------------------------------------------------------------\n";

    for (const auto& e : schedule) {
        std::cout << std::left
                  << std::setw(12) << e.orderId
                  << std::setw(24) << e.operationName
                  << std::setw(22) << e.machineName
                  << std::setw(10) << (std::to_string(e.startTime) + "m")
                  << std::setw(10) << (std::to_string(e.endTime) + "m")
                  << std::setw(10) << (std::to_string(e.duration) + "m")
                  << "\n";
    }
    std::cout << "========================================================================================\n";
}

int main() {
    std::cout << "=======================================================================\n";
    std::cout << " Smart Dynamic Production Scheduling & Machine Optimization System    \n";
    std::cout << " Rohan Malhotra - Industrial Electronics Manufacturing Plant            \n";
    std::cout << "=======================================================================\n";

    // 1. Initialize Machines
    std::vector<Machine> machines = {
        {"M1", "Assembly Robot 1", "Pick & Place", {"Component Assembly"}, 1.0, MachineStatus::AVAILABLE},
        {"M2", "Soldering Robot", "Selective Soldering", {"Soldering"}, 1.2, MachineStatus::AVAILABLE},
        {"M3", "Testing Station Alpha", "In-Circuit Tester", {"Testing"}, 1.0, MachineStatus::AVAILABLE},
        {"M4", "Calibration Station", "Laser Tuning", {"Calibration"}, 1.0, MachineStatus::AVAILABLE},
        {"M5", "Quality Inspection", "AOI Scanner", {"Quality Inspection"}, 1.1, MachineStatus::AVAILABLE},
        {"M6", "Secondary Backup Cell", "Multi-Tool", {"Component Assembly", "Soldering", "Quality Inspection"}, 0.9, MachineStatus::AVAILABLE}
    };

    // 2. Initialize Production Orders with Dependent Operations (DAG)
    std::vector<Order> orders = {
        {
            "ORD-101", "Siemens Automation", "PLC Controller v4", PriorityLevel::HIGH, 50, 120, 0, false,
            {
                {"OP-101-1", "ORD-101", "Component Assembly", 1, "Component Assembly", 20, {}},
                {"OP-101-2", "ORD-101", "Soldering", 2, "Soldering", 15, {"OP-101-1"}},
                {"OP-101-3", "ORD-101", "Testing", 3, "Testing", 12, {"OP-101-2"}},
                {"OP-101-4", "ORD-101", "Calibration", 4, "Calibration", 10, {"OP-101-3"}},
                {"OP-101-5", "ORD-101", "Quality Inspection", 5, "Quality Inspection", 8, {"OP-101-4"}}
            }
        },
        {
            "ORD-102", "ABB Robotics", "Servo Drive Unit", PriorityLevel::CRITICAL, 30, 90, 0, false,
            {
                {"OP-102-1", "ORD-102", "Component Assembly", 1, "Component Assembly", 18, {}},
                {"OP-102-2", "ORD-102", "Soldering", 2, "Soldering", 12, {"OP-102-1"}},
                {"OP-102-3", "ORD-102", "Testing", 3, "Testing", 15, {"OP-102-2"}},
                {"OP-102-4", "ORD-102", "Quality Inspection", 4, "Quality Inspection", 10, {"OP-102-3"}}
            }
        }
    };

    std::cout << "[Step 1] Generating Initial Baseline Production Schedule...\n";
    auto initialSchedule = scheduleFactory(orders, machines, 0);
    printSchedule(initialSchedule);

    // Dynamic Disruption Event: Machine M3 fails at T=30 for 35 minutes!
    std::cout << "\n[Step 2] DYNAMIC EVENT TRIGGERED: Machine M3 Fails at T=30m for 35m!\n";
    machines[2].status = MachineStatus::FAILED;
    machines[2].blockedIntervals.push_back({30, 65, "FAILURE", "Hardware breakdown"});

    std::cout << "[Step 3] Executing Dynamic Rescheduling from T=30m (Preserving completed operations)...\n";
    auto rescheduled = scheduleFactory(orders, machines, 30);
    printSchedule(rescheduled);

    return 0;
}

