import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ShortlistedCard } from "@/components/admin/ShortlistedCard";
import { GlobalScheduleForm } from "@/components/admin/GlobalScheduleForm";

export const dynamic = 'force-dynamic';

export default async function ShortlistedPage({ params }: { params: Promise<{ jobId: string }> }) {
    const { jobId } = await params;

    const job = await prisma.job.findUnique({
        where: { id: jobId },
        include: {
            applications: {
                where: {
                    status: {
                        in: ['shortlisted', 'simulation_invited', 'simulation_completed']
                    }
                },
                orderBy: { createdAt: 'desc' },
                include: {
                    taskAssignments: true
                }
            }
        }
    });

    if (!job) notFound();

    return (
        <div className="container mx-auto px-4 py-12 max-w-6xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Shortlisted Candidates</h1>
                <p className="text-slate-400 text-lg">
                    Ready for Technical Simulation • {job.applications.length} Candidates
                </p>
            </div>

            {/* Global Schedule Form */}
            <GlobalScheduleForm
                jobId={job.id}
                currentSchedule={job.assessmentScheduledAt ? job.assessmentScheduledAt.toISOString() : null}
                config={job.assessmentConfig}
            />

            <div className="grid gap-6">
                {job.applications.length === 0 ? (
                    <div className="text-center py-20 bg-slate-900/50 rounded-xl border border-white/5">
                        <div className="text-slate-500 mb-2">No shortlisted candidates yet</div>
                        <p className="text-sm text-slate-600">Go to the main list to review and shortlist applicants.</p>
                    </div>
                ) : (
                    job.applications.map(app => (
                        <ShortlistedCard key={app.id} application={app} />
                    ))
                )}
            </div>
        </div>
    );
}
