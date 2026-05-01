import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Task from "@/models/Task";
import Project from "@/models/Project";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const projects = await Project.find({
      $or: [{ owner: payload.userId }, { "members.user": payload.userId }],
    }).select("_id");

    const projectIds = projects.map((p) => p._id);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const projectId = searchParams.get("projectId");

    const filter = {};

    if (projectId) {
      filter.project = projectId;
    } else {
      filter.project = { $in: projectIds };
    }

    if (status && ["todo", "in-progress", "completed"].includes(status)) {
      filter.status = status;
    }
    if (priority && ["low", "medium", "high"].includes(priority)) {
      filter.priority = priority;
    }

    const tasks = await Task.find(filter)
      .populate("assignee", "name email")
      .populate("createdBy", "name email")
      .populate("project", "name")
      .sort({ createdAt: -1 });

    return NextResponse.json({ tasks });
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
    const { title, description, status, priority, projectId, assigneeId, dueDate } = body;

    if (!title || title.trim().length < 2) {
      return NextResponse.json({ error: "Task title must be at least 2 characters" }, { status: 400 });
    }

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const isMember = project.members.some((m) => m.user.toString() === payload.userId);
    const isOwner = project.owner.toString() === payload.userId;

    if (!isMember && !isOwner) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (assigneeId) {
      const assigneeIsMember = project.members.some((m) => m.user.toString() === assigneeId);
      if (!assigneeIsMember && project.owner.toString() !== assigneeId) {
        return NextResponse.json({ error: "Assignee must be a project member" }, { status: 400 });
      }
    }

    const task = await Task.create({
      title: title.trim(),
      description: description?.trim() || "",
      status: status || "todo",
      priority: priority || "medium",
      project: projectId,
      assignee: assigneeId || null,
      createdBy: payload.userId,
      dueDate: dueDate ? new Date(dueDate) : null,
    });

    const populated = await Task.findById(task._id)
      .populate("assignee", "name email")
      .populate("createdBy", "name email")
      .populate("project", "name");

    return NextResponse.json({ message: "Task created successfully", task: populated }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
