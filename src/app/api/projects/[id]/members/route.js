import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Project from "@/models/Project";
import User from "@/models/User";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(req, context) {
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
      return NextResponse.json({ error: "Only admins can add members" }, { status: 403 });
    }

    const body = await req.json();
    const { email, role = "member" } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (!["admin", "member"].includes(role)) {
      return NextResponse.json({ error: "Role must be 'admin' or 'member'" }, { status: 400 });
    }

    const userToAdd = await User.findOne({ email: email.toLowerCase() });
    if (!userToAdd) {
      return NextResponse.json({ error: "User not found with that email" }, { status: 404 });
    }

    const alreadyMember = project.members.some((m) => m.user.toString() === userToAdd._id.toString());
    if (alreadyMember) {
      return NextResponse.json({ error: "User is already a member of this project" }, { status: 409 });
    }

    project.members.push({ user: userToAdd._id, role });
    await project.save();

    const updated = await Project.findById(id)
      .populate("owner", "name email")
      .populate("members.user", "name email");

    return NextResponse.json({ message: "Member added successfully", project: updated });
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

    const memberEntry = project.members.find((m) => m.user.toString() === payload.userId);
    const isOwner = project.owner.toString() === payload.userId;

    if (!isOwner && (!memberEntry || memberEntry.role !== "admin")) {
      return NextResponse.json({ error: "Only admins can remove members" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId query parameter is required" }, { status: 400 });
    }

    if (project.owner.toString() === userId) {
      return NextResponse.json({ error: "Cannot remove the project owner" }, { status: 400 });
    }

    project.members = project.members.filter((m) => m.user.toString() !== userId);
    await project.save();

    const updated = await Project.findById(id)
      .populate("owner", "name email")
      .populate("members.user", "name email");

    return NextResponse.json({ message: "Member removed successfully", project: updated });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
