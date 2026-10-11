# OptiSched: Smart Dynamic Production Scheduling & Machine Optimization System

[![Next.js](https://img.shields.io/badge/Next.js-14.2.35-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/Neon_PostgreSQL-Serverless-333333?style=for-the-badge&logo=postgresql)](https://neon.tech/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![C++17](https://img.shields.io/badge/C++17-STL_Reference-00599C?style=for-the-badge&logo=c%2B%2B)](https://isocpp.org/)
[![Vitest](https://img.shields.io/badge/Vitest-Passed_100%25-6E9F18?style=for-the-badge&logo=vitest)](https://vitest.dev/)

---

## 🏭 1. Problem Statement Background

**Mr. Rohan Malhotra**, Production Head of an automated electronics manufacturing plant, is responsible for ensuring the timely completion of customized industrial controllers ordered by multiple global clients.

Each product requires multiple manufacturing operations:
$$\text{Component Assembly} \longrightarrow \text{Precision Soldering} \longrightarrow \text{Automated Testing} \longrightarrow \text{Laser Calibration} \longrightarrow \text{AOI Quality Inspection}$$

where operations can begin only after the successful completion of their prerequisites (precedence constraints). The factory consists of multiple robotic workstations with differing processing speeds and capabilities. In practice, **unscheduled machine breakdowns**, **emergency high-priority customer orders**, and **scheduled maintenance windows** continuously disrupt the initial baseline schedule.

**OptiSched** is an end-to-end intelligent production scheduling and machine optimization system capable of dynamically adapting to changing manufacturing conditions without interrupting ongoing operations.

---

## 🎯 2. System Objectives

1. **Maximize Order Fulfillment Rate & On-Time Delivery**: Prioritize orders using dynamic slack time urgency.
2. **Minimize Machine Idle Time & Makespan**: Heuristic contiguous time-slot allocation across all compatible workstations.
3. **Isolate Dynamic Disruptions**: Intelligently re-route affected tasks upon machine failure or urgent order arrival while strictly preserving completed and healthy running tasks.
4. **Theory of Constraints (TOC) Bottleneck Detection**: Automatically identify machine queues and provide explainable AI insights.
5. **Academic Viva Readiness**: Fully deterministic execution, explainable decision logs, before/after comparative analysis, and standard C++17 STL reference mapping.

---

## 🏗️ 3. System Architecture & Workflows

### System Architecture Diagram
```mermaid
flowchart TD
    subgraph UI_Layer["Frontend & Visualization Layer"]
        A[Dashboard / Control Room]
        B[Interactive Gantt Timeline]
        C[SVG Operation DAG Viewer]
        D[Guided Viva Demo Mode]
        E[Recharts Analytics]
    end

    subgraph Core_Engine["Core Engine (Deterministic Algorithms)"]
        F[DAG Precedence Resolver]
        G[Slack & Urgency Priority Queue]
        H[Heuristic Machine Assignment EFT]
        I[Dynamic Rescheduler]
        J[Weighted Multi-Objective Function]
    end

    subgraph Persistence_Layer["Data & Persistence Layer"]
        K[(Neon Serverless PostgreSQL)]
        L[Drizzle ORM Schema]
        M[Local In-Memory Preset Cache]
    end

    UI_Layer --> Core_Engine
    Core_Engine --> Persistence_Layer
    Core_Engine --> UI_Layer
```

### Scheduling & Rescheduling Workflow
```mermaid
sequenceDiagram
    autonumber
    participant User as Production Manager
    participant UI as Dashboard & Gantt
    participant DAG as DAG Dependency Resolver
    participant PQ as Priority Queue (Heap)
    participant Assign as Heuristic Machine Allocator
    participant Resched as Dynamic Rescheduler

    User->>UI: Click "Generate Schedule"
    UI->>DAG: Build DAG & calculate in-degrees
    DAG->>PQ: Push zero in-degree (Ready) operations
    loop While operations exist in Queue
        PQ->>Assign: Pop top operation (Max Slack Urgency)
        Assign->>Assign: Search Earliest Free Time Slot (EFT)
        Assign->>DAG: Satisfy successors & decrement in-degrees
    end
    Assign->>UI: Render Gantt Timeline & Score
    Note over User,UI: Dynamic Event (e.g., M3 Fails at T=30m)
    User->>UI: Inject Event (Machine Failure)
    UI->>Resched: Trigger performDynamicReschedule(currentTime=30)
    Resched->>Resched: Lock Completed (T <= 30) & Running tasks
    Resched->>Resched: Re-route affected pending tasks to backup cells
    Resched->>UI: Render Updated Schedule + Before vs After Diff
```

### Database Entity-Relationship (ER) Diagram
```mermaid
erDiagram
    SCENARIOS ||--o{ MACHINES : contains
    SCENARIOS ||--o{ ORDERS : contains
    ORDERS ||--o{ OPERATIONS : has
    SCENARIOS ||--o{ SIMULATION_RUNS : records

    SCENARIOS {
        string id PK
        string name
        string description
        boolean is_preset
        string category
        jsonb objective_weights
    }

    MACHINES {
        string id PK
        string scenario_id FK
        string name
        string type
        jsonb capabilities
        float processing_speed
        string status
        jsonb maintenance_periods
        jsonb failures
    }

    ORDERS {
        string id PK
        string scenario_id FK
        string customer_name
        string product_name
        string priority
        int quantity
        int deadline
        string status
        int created_at_time
    }

    OPERATIONS {
        string id PK
        string order_id FK
        string scenario_id FK
        string name
        int sequence_number
        string required_capability
        int processing_time
        jsonb dependencies
    }

    SIMULATION_RUNS {
        string id PK
        string scenario_id FK
        string scenario_name
        int run_time_minutes
        int total_orders
        int completed_orders
        int delayed_orders
        float total_idle_time
        float average_utilization
        float overall_score
        string bottleneck_machine
        jsonb schedule_data
        jsonb metrics_data
    }
```

---

## 🧮 4. Data Structures & Algorithms

### Core Data Structures
| Data Structure | C++ STL Container | Primary Purpose | Complexity |
| :--- | :--- | :--- | :--- |
| **Operation Ready Queue** | `std::priority_queue` | Max-heap dispatching highest urgency operations | $O(\log N)$ |
| **Dependency DAG** | `std::unordered_map<string, vector<string>>` | Adjacency list storing precedence constraints | $O(1)$ lookup |
| **Machine Intervals** | `std::vector<TimeInterval>` | Stores busy, maintenance, and failure blocks | $O(M \log M)$ merge |
| **Completed Operations** | `std::unordered_set<string>` | Constant-time fulfillment validation | $O(1)$ hash check |

### Multi-Attribute Priority Urgency Score
$$\text{PriorityScore} = \text{BaseWeight}(\text{Priority}) + \text{SlackAdjustment} + \text{UrgentBoost} + \text{FIFOBonus}$$
where:
$$\text{Slack} = \text{Deadline} - (\text{CurrentTime} + \text{RemainingWork})$$

### Weighted Multi-Objective Function
$$\text{ScheduleScore} = w_{comp} N_{completed} + w_{ontime} N_{ontime} + w_{prio} \sum PrioMultiplier + w_{util} \bar{U} - w_{idle} \sum T_{idle} - w_{delay} \sum T_{delay} - w_{conflict} N_{conflicts} - w_{missed} N_{missed}$$

---

## 🚀 5. Getting Started & Local Installation

### Prerequisites
- **Node.js**: v18.0.0 or later (v20+ recommended)
- **npm**: v9.0.0 or later

### Installation Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/smart-production-scheduler.git
   cd smart-production-scheduler
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables** (Optional for local demo):
   ```bash
   cp .env.example .env.local
   ```
   Add your Neon PostgreSQL database URL if cloud persistence is desired:
   ```env
   DATABASE_URL=postgresql://user:password@ep-sample-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
   *(Note: If `DATABASE_URL` is omitted, OptiSched runs seamlessly with an in-memory/preset repository).*

4. **Run Database Migrations (Optional)**:
   ```bash
   npm run db:push
   ```

5. **Start Local Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

6. **Run Automated Test Suite**:
   ```bash
   npm test
   ```

7. **Production Build**:
   ```bash
   npm run build
   ```

---

## ⚡ 6. Standalone C++17 Algorithm Execution

To run the standalone academic C++ reference engine:

```bash
# Compile using any standard C++17 compiler (GCC / Clang / MSVC)
g++ -std=c++17 -O3 cpp/scheduler.cpp -o scheduler

# Execute
./scheduler
```

---

## 🎭 7. Viva Demonstration Walkthrough (6 Steps)

1. **Step 1: Baseline Initialization** — Open `/demo` and load the baseline scenario with 6 workstations and 3 multi-operation orders.
2. **Step 2: Machine Breakdown at T=30m** — Trigger M3 failure for 35 minutes; observe failure pattern on Gantt chart.
3. **Step 3: Urgent Order Insertion at T=40m** — Insert CRITICAL defense order; observe slack-aware preemption.
4. **Step 4: Scheduled Maintenance at T=60m** — M4 enters calibration; jobs reroute to secondary backup cell M6.
5. **Step 5: Dynamic Reschedule & Diff** — Inspect side-by-side Before vs After metrics table and net delta improvements.
6. **Step 6: Performance Verdict** — Review utilization charts, Theory of Constraints bottleneck diagnosis, and overall score.

---

## ☁️ 8. Vercel & Neon Cloud Deployment

1. Push your code to GitHub.
2. Import the repository in [Vercel](https://vercel.com).
3. Connect **Neon PostgreSQL** from the Vercel Marketplace or enter `DATABASE_URL` in **Project Settings > Environment Variables**.
4. Click **Deploy**. Vercel will automatically build and launch the application.

---

## 👥 9. Academic Project Credits

- **Project Title:** Smart Dynamic Production Scheduling and Machine Optimization System
- **Domain:** Advanced Data Structures, Heuristic Scheduling & Robotic Manufacturing
- **Academic Context:** Electronics Manufacturing Optimization (Mr. Rohan Malhotra Problem Statement)

