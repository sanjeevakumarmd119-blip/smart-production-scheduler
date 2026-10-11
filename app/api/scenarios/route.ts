import { NextResponse } from "next/server";
import { getAllScenarios, saveScenario } from "../../../lib/db/queries";
import { validateScenario } from "../../../lib/validation/validator";

export async function GET() {
  try {
    const data = await getAllScenarios();
    return NextResponse.json({ success: true, scenarios: data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = validateScenario(body);

    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          errors: validation.errors,
          message: "Scenario validation failed",
        },
        { status: 400 }
      );
    }

    const result = await saveScenario(body);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

