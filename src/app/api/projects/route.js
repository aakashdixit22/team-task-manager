import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Project from "@/models/Project";
import User from "@/models/User";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const projects = await Project.find({
      $or: [
        { owner: payload.userId },
        { "members.user": payload.userId },
      ],
    })
      .populate("owner", "name email")
      .populate("members.user", "name email")
      .sort({ updatedAt: -1 });

    return NextResponse.json({ projects });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const body = await req.json();
    const { name, description } = body;

    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Project name must be at least 2 characters" },
        { status: 400 }
      );
    }

    await User.findById(payload.userId);

    const project = await Project.create({
      name: name.trim(),
      description: description?.trim() || "",
      owner: payload.userId,
      members: [{ user: payload.userId, role: "admin" }],
    });

    const populated = await Project.findById(project._id)
      .populate("owner", "name email")
      .populate("members.user", "name email");

    return NextResponse.json(
      { message: "Project created successfully", project: populated },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
