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
    })
      .populate("owner", "name email")
      .populate("members.user", "name email");

    const projectIds = projects.map((p) => p._id);

    const allTasks = await Task.find({ project: { $in: projectIds } })
      .populate("assignee", "name email")
      .populate("project", "name")
      .sort({ createdAt: -1 });

    const myTasks = allTasks.filter(
      (t) => t.assignee && t.assignee._id.toString() === payload.userId
    );

    const totalTasks = allTasks.length;
    const todoTasks = allTasks.filter((t) => t.status === "todo").length;
    const inProgressTasks = allTasks.filter((t) => t.status === "in-progress").length;
    const completedTasks = allTasks.filter((t) => t.status === "completed").length;

    const now = new Date();
    const overdueTasks = allTasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== "completed"
    );

    const recentTasks = allTasks.slice(0, 10);

    const highPriorityTasks = allTasks.filter(
      (t) => t.priority === "high" && t.status !== "completed"
    );

    return NextResponse.json({
      stats: {
        totalProjects: projects.length,
        totalTasks,
        todoTasks,
        inProgressTasks,
        completedTasks,
        overdueTasks: overdueTasks.length,
        myTasks: myTasks.length,
      },
      recentTasks,
      overdueTasks,
      highPriorityTasks,
      projects,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
