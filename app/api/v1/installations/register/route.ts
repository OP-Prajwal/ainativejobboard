import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_do_not_use_in_prod";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { installation_id, domain } = body;

        if (!installation_id) {
            return NextResponse.json(
                { error: "installation_id is required" },
                { status: 400 }
            );
        }

        // 1. Check if exists
        const existing = await prisma.installation.findUnique({
            where: { installationId: installation_id },
        });

        if (existing && existing.installationToken) {
            return NextResponse.json({
                installation_id,
                installation_token: existing.installationToken,
                is_new: false,
            });
        }

        // 2. Create New
        const token = jwt.sign({ installation_id, domain }, JWT_SECRET, {
            expiresIn: "365d",
        });

        await prisma.installation.create({
            data: {
                installationId: installation_id,
                domain: domain || null,
                installationToken: token,
            },
        });

        return NextResponse.json({
            installation_id,
            installation_token: token,
            is_new: true,
        });
    } catch (error) {
        console.error("Registration error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
