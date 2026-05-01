import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Task from "@/models/Task";
import Project from "@/models/Project";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req, context) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id } = await context.params;

    const task = await Task.findById(id)
      .populate("assignee", "name email")
      .populate("createdBy", "name email")
      .populate("project", "name");

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ task });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req, context) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id } = await context.params;

    const task = await Task.findById(id);
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const project = await Project.findById(task.project);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const isMember = project.members.some((m) => m.user.toString() === payload.userId);
    const isOwner = project.owner.toString() === payload.userId;

    if (!isMember && !isOwner) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const memberEntry = project.members.find((m) => m.user.toString() === payload.userId);
    const isAdmin = isOwner || (memberEntry && memberEntry.role === "admin");

    const body = await req.json();
    const { title, description, status, priority, assigneeId, dueDate } = body;

    if (!isAdmin) {
      if (status && ["todo", "in-progress", "completed"].includes(status)) {
        task.status = status;
      }
    } else {
      if (title !== undefined) task.title = title.trim();
      if (description !== undefined) task.description = description.trim();
      if (status !== undefined) task.status = status;
      if (priority !== undefined) task.priority = priority;
      if (assigneeId !== undefined) task.assignee = assigneeId || null;
      if (dueDate !== undefined) task.dueDate = dueDate ? new Date(dueDate) : null;
    }

    await task.save();

    const updated = await Task.findById(id)
      .populate("assignee", "name email")
      .populate("createdBy", "name email")
      .populate("project", "name");

    return NextResponse.json({ message: "Task updated", task: updated });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req, context) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id } = await context.params;

    const task = await Task.findById(id);
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const project = await Project.findById(task.project);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const memberEntry = project.members.find((m) => m.user.toString() === payload.userId);
    const isOwner = project.owner.toString() === payload.userId;
    const isAdmin = isOwner || (memberEntry && memberEntry.role === "admin");

    if (!isAdmin) {
      return NextResponse.json({ error: "Only admins can delete tasks" }, { status: 403 });
    }

    await Task.findByIdAndDelete(id);

    return NextResponse.json({ message: "Task deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
