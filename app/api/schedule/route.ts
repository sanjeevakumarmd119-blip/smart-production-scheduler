import { NextResponse } from "next/server";
import { generateProductionSchedule } from "../../../lib/scheduler/scheduler";
import { performDynamicReschedule } from "../../../lib/scheduler/rescheduler";
import { validateScenario } from "../../../lib/validation/validator";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, orders, machines, currentTime = 0, triggerEvent, originalSchedule, customWeights } = body;

    const validation = validateScenario({ machines, orders });
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, errors: validation.errors, message: "Invalid factory setup" },
        { status: 400 }
      );
    }

    if (action === "RESCHEDULE" && triggerEvent) {
      const result = performDynamicReschedule({
        currentTime,
        triggerEvent,
        originalSchedule: originalSchedule || [],
        orders,
        machines,
        customWeights,
      });
      return NextResponse.json({ success: true, result });
    }

    // Default: Initial schedule generation
    const result = generateProductionSchedule(orders, machines, currentTime, [], customWeights);
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

