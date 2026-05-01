import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Project from "@/models/Project";
import Task from "@/models/Task";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req, context) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id } = await context.params;

    const project = await Project.findById(id)
      .populate("owner", "name email")
      .populate("members.user", "name email");

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const isMember = project.members.some((m) => m.user._id.toString() === payload.userId);
    const isOwner = project.owner._id.toString() === payload.userId;

    if (!isMember && !isOwner) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const tasks = await Task.find({ project: id })
      .populate("assignee", "name email")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    return NextResponse.json({ project, tasks });
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

    const project = await Project.findById(id);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const memberEntry = project.members.find((m) => m.user.toString() === payload.userId);
    const isOwner = project.owner.toString() === payload.userId;

    if (!isOwner && (!memberEntry || memberEntry.role !== "admin")) {
      return NextResponse.json({ error: "Only admins can update projects" }, { status: 403 });
    }

    const body = await req.json();
    const { name, description } = body;

    if (name !== undefined) {
      if (name.trim().length < 2) {
        return NextResponse.json({ error: "Project name must be at least 2 characters" }, { status: 400 });
      }
      project.name = name.trim();
    }

    if (description !== undefined) {
      project.description = description.trim();
    }

    await project.save();

    const updated = await Project.findById(id)
      .populate("owner", "name email")
      .populate("members.user", "name email");

    return NextResponse.json({ message: "Project updated", project: updated });
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

    const project = await Project.findById(id);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.owner.toString() !== payload.userId) {
      return NextResponse.json({ error: "Only the project owner can delete it" }, { status: 403 });
    }

    await Task.deleteMany({ project: id });
    await Project.findByIdAndDelete(id);

    return NextResponse.json({ message: "Project deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
