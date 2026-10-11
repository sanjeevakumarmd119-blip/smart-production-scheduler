import { NextResponse } from "next/server";
import { getSimulationRuns, saveSimulationRun } from "../../../lib/db/queries";

export async function GET() {
  try {
    const runs = await getSimulationRuns(25);
    return NextResponse.json({ success: true, runs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { scenarioId, scenarioName, metrics, scheduleEntries } = body;

    const result = await saveSimulationRun(scenarioId, scenarioName, metrics, scheduleEntries);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

