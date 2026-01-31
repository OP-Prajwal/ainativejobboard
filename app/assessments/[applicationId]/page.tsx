'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
    getAssessmentData,
    startAssessment,
    submitAssessment
} from '@/app/actions/assessment';

type AssessmentStatus = 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED';

interface AssessmentData {
    assignment: {
        id: string;
        status: AssessmentStatus;
        timeLimitMinutes: number;
        startedAt: Date | null;
        submittedAt: Date | null;
        timeTakenSeconds: number | null;
    };
    task: {
        id: string;
        title: string;
        description?: string;
        starterCode?: string;
        taskInvariants?: string[];
    } | null;
    evaluation?: {
        aiScore: number | null;
        confidence: number | null;
        aiFeedback: string | null;
    };
}

export default function AssessmentPage() {
    const params = useParams();
    const applicationId = params.applicationId as string;

    const [data, setData] = useState<AssessmentData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [initialPrompt, setInitialPrompt] = useState('');
    const [aiDraft, setAiDraft] = useState('');
    const [finalSubmission, setFinalSubmission] = useState('');
    const [refinementExplanation, setRefinementExplanation] = useState('');
    const [unchangedExplanation, setUnchangedExplanation] = useState('');

    // Timer state
    const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        const result = await getAssessmentData(applicationId);
        if (result.success) {
            setData(result.data);
            // Calculate remaining time if in progress
            if (result.data.assignment.status === 'IN_PROGRESS' && result.data.assignment.startedAt) {
                const startedAt = new Date(result.data.assignment.startedAt);
                const limitMs = result.data.assignment.timeLimitMinutes * 60 * 1000;
                const elapsed = Date.now() - startedAt.getTime();
                const remaining = Math.max(0, Math.floor((limitMs - elapsed) / 1000));
                setRemainingSeconds(remaining);
            }
        } else {
            setError(result.error);
        }
        setLoading(false);
    }, [applicationId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Timer countdown
    useEffect(() => {
        if (remainingSeconds === null || remainingSeconds <= 0) return;

        const timer = setInterval(() => {
            setRemainingSeconds(prev => {
                if (prev === null || prev <= 0) return null;
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [remainingSeconds]);

    const handleStart = async () => {
        if (!data) return;
        setLoading(true);
        const result = await startAssessment(data.assignment.id);
        if (result.success) {
            await loadData();
        } else {
            setError(result.error);
        }
        setLoading(false);
    };

    const handleSubmit = async () => {
        if (!data) return;
        setSubmitting(true);

        const result = await submitAssessment(data.assignment.id, {
            initialPrompt,
            aiDraft,
            finalSubmission,
            refinementExplanation,
            unchangedExplanation
        });

        if (result.success) {
            await loadData();
        } else {
            setError(result.error);
        }
        setSubmitting(false);
    };

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <div style={styles.container}>
                <div style={styles.loading}>Loading assessment...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={styles.container}>
                <div style={styles.error}>Error: {error}</div>
            </div>
        );
    }

    if (!data) {
        return (
            <div style={styles.container}>
                <div style={styles.error}>Assessment not found</div>
            </div>
        );
    }

    const { assignment, task, evaluation } = data;

    // PENDING state - show welcome, no task details (Black Box Start)
    if (assignment.status === 'PENDING') {
        return (
            <div style={styles.container}>
                <div style={styles.card}>
                    <h1 style={styles.title}>Assessment Ready</h1>
                    <p style={styles.subtitle}>Task: {task?.title || 'Technical Assessment'}</p>

                    <div style={styles.infoBox}>
                        <p><strong>Time Limit:</strong> {assignment.timeLimitMinutes} minutes</p>
                        <p><strong>Instructions:</strong></p>
                        <ul style={styles.list}>
                            <li>You may use AI tools (ChatGPT, Claude, Copilot, etc.)</li>
                            <li>You must document your AI usage transparently</li>
                            <li>The timer starts when you click "Start Assessment"</li>
                            <li>You cannot pause once started</li>
                        </ul>
                    </div>

                    <div style={styles.warning}>
                        ⚠️ Once you start, the task details will be revealed and the timer will begin.
                    </div>

                    <button onClick={handleStart} style={styles.primaryButton}>
                        Start Assessment
                    </button>
                </div>
            </div>
        );
    }

    // IN_PROGRESS state - show task and input form
    if (assignment.status === 'IN_PROGRESS') {
        return (
            <div style={styles.container}>
                <div style={styles.header}>
                    <h1 style={styles.title}>Assessment In Progress</h1>
                    {remainingSeconds !== null && (
                        <div style={{
                            ...styles.timer,
                            color: remainingSeconds < 300 ? '#dc2626' : '#059669'
                        }}>
                            ⏱️ {formatTime(remainingSeconds)}
                        </div>
                    )}
                </div>

                <div style={styles.taskCard}>
                    <h2 style={styles.sectionTitle}>Task Description</h2>
                    <pre style={styles.description}>{task?.description}</pre>

                    {task?.starterCode && (
                        <>
                            <h3 style={styles.sectionTitle}>Starter Code</h3>
                            <pre style={styles.code}>{task.starterCode}</pre>
                        </>
                    )}

                    {task?.taskInvariants && task.taskInvariants.length > 0 && (
                        <>
                            <h3 style={styles.sectionTitle}>Requirements (Invariants)</h3>
                            <ul style={styles.list}>
                                {task.taskInvariants.map((inv, i) => (
                                    <li key={i}>{inv}</li>
                                ))}
                            </ul>
                        </>
                    )}
                </div>

                <div style={styles.formCard}>
                    <h2 style={styles.sectionTitle}>Your Submission</h2>

                    <div style={styles.field}>
                        <label style={styles.label}>
                            1. Initial Prompt (What did you ask the AI?)
                            <span style={styles.charCount}>{initialPrompt.length}/10000</span>
                        </label>
                        <textarea
                            style={styles.textarea}
                            value={initialPrompt}
                            onChange={e => setInitialPrompt(e.target.value)}
                            placeholder="Paste or write the prompt you used..."
                            rows={6}
                        />
                    </div>

                    <div style={styles.field}>
                        <label style={styles.label}>
                            2. AI Draft (What did the AI produce?)
                            <span style={styles.charCount}>{aiDraft.length}/50000</span>
                        </label>
                        <textarea
                            style={styles.textarea}
                            value={aiDraft}
                            onChange={e => setAiDraft(e.target.value)}
                            placeholder="Paste the AI's response..."
                            rows={10}
                        />
                    </div>

                    <div style={styles.field}>
                        <label style={styles.label}>
                            3. Final Submission (Your final code/solution)
                            <span style={styles.charCount}>{finalSubmission.length}/50000</span>
                        </label>
                        <textarea
                            style={styles.textarea}
                            value={finalSubmission}
                            onChange={e => setFinalSubmission(e.target.value)}
                            placeholder="Paste your final solution..."
                            rows={12}
                        />
                    </div>

                    <div style={styles.field}>
                        <label style={styles.label}>
                            4. What did you change and why?
                            <span style={styles.charCount}>{refinementExplanation.length}/5000</span>
                        </label>
                        <textarea
                            style={styles.textarea}
                            value={refinementExplanation}
                            onChange={e => setRefinementExplanation(e.target.value)}
                            placeholder="Explain the changes you made to the AI's output..."
                            rows={6}
                        />
                    </div>

                    <div style={styles.field}>
                        <label style={styles.label}>
                            5. What did you NOT change and why?
                            <span style={styles.charCount}>{unchangedExplanation.length}/3000</span>
                        </label>
                        <textarea
                            style={styles.textarea}
                            value={unchangedExplanation}
                            onChange={e => setUnchangedExplanation(e.target.value)}
                            placeholder="Explain what you kept as-is and your reasoning..."
                            rows={4}
                        />
                    </div>

                    <button
                        onClick={handleSubmit}
                        style={styles.submitButton}
                        disabled={submitting || !finalSubmission.trim()}
                    >
                        {submitting ? 'Submitting...' : 'Submit Assessment'}
                    </button>
                </div>
            </div>
        );
    }

    // SUBMITTED state - thank you message
    if (assignment.status === 'SUBMITTED') {
        return (
            <div style={styles.container}>
                <div style={styles.card}>
                    <h1 style={styles.title}>✅ Assessment Submitted</h1>
                    <p style={styles.subtitle}>Thank you for completing the assessment!</p>

                    <div style={styles.infoBox}>
                        <p><strong>Time Taken:</strong> {assignment.timeTakenSeconds
                            ? `${Math.floor(assignment.timeTakenSeconds / 60)} minutes`
                            : 'N/A'}</p>
                        <p><strong>Status:</strong> Awaiting evaluation</p>
                    </div>

                    <p style={styles.text}>
                        Your submission is being reviewed. You will be notified of the results.
                    </p>
                </div>
            </div>
        );
    }

    // GRADED state - show results
    if (assignment.status === 'GRADED' && evaluation) {
        return (
            <div style={styles.container}>
                <div style={styles.card}>
                    <h1 style={styles.title}>Assessment Complete</h1>

                    <div style={styles.scoreBox}>
                        <div style={styles.score}>
                            {evaluation.aiScore ?? 'N/A'}
                            <span style={styles.scoreMax}>/100</span>
                        </div>
                        <div style={styles.confidence}>
                            Confidence: {evaluation.confidence
                                ? `${Math.round(evaluation.confidence * 100)}%`
                                : 'N/A'}
                        </div>
                    </div>

                    {evaluation.aiFeedback && (
                        <div style={styles.feedbackBox}>
                            <h3 style={styles.sectionTitle}>Feedback</h3>
                            <p style={styles.text}>{evaluation.aiFeedback}</p>
                        </div>
                    )}

                    <p style={styles.disclaimer}>
                        Note: This is an AI-generated recommendation.
                        Final decisions are made by human reviewers.
                    </p>
                </div>
            </div>
        );
    }

    return null;
}

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        maxWidth: '900px',
        margin: '0 auto',
        padding: '24px',
        fontFamily: 'system-ui, -apple-system, sans-serif'
    },
    loading: {
        textAlign: 'center',
        padding: '48px',
        color: '#6b7280'
    },
    error: {
        textAlign: 'center',
        padding: '24px',
        color: '#dc2626',
        background: '#fef2f2',
        borderRadius: '8px'
    },
    card: {
        background: '#fff',
        borderRadius: '12px',
        padding: '32px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
    },
    title: {
        fontSize: '28px',
        fontWeight: 700,
        color: '#111827',
        margin: 0
    },
    subtitle: {
        fontSize: '18px',
        color: '#6b7280',
        margin: '8px 0 24px'
    },
    timer: {
        fontSize: '24px',
        fontWeight: 700,
        padding: '8px 16px',
        borderRadius: '8px',
        background: '#f3f4f6'
    },
    infoBox: {
        background: '#f9fafb',
        padding: '16px 20px',
        borderRadius: '8px',
        marginBottom: '24px'
    },
    list: {
        paddingLeft: '20px',
        margin: '8px 0'
    },
    warning: {
        background: '#fffbeb',
        border: '1px solid #fbbf24',
        color: '#92400e',
        padding: '12px 16px',
        borderRadius: '8px',
        marginBottom: '24px'
    },
    primaryButton: {
        width: '100%',
        padding: '14px 24px',
        fontSize: '16px',
        fontWeight: 600,
        color: '#fff',
        background: '#2563eb',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer'
    },
    taskCard: {
        background: '#fff',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        border: '1px solid #e5e7eb'
    },
    formCard: {
        background: '#fff',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        border: '1px solid #e5e7eb'
    },
    sectionTitle: {
        fontSize: '18px',
        fontWeight: 600,
        color: '#374151',
        marginBottom: '12px'
    },
    description: {
        background: '#f9fafb',
        padding: '16px',
        borderRadius: '6px',
        whiteSpace: 'pre-wrap',
        fontSize: '14px',
        lineHeight: 1.6,
        fontFamily: 'inherit'
    },
    code: {
        background: '#1f2937',
        color: '#f9fafb',
        padding: '16px',
        borderRadius: '6px',
        fontSize: '13px',
        overflow: 'auto',
        fontFamily: 'monospace'
    },
    field: {
        marginBottom: '20px'
    },
    label: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '14px',
        fontWeight: 500,
        color: '#374151',
        marginBottom: '6px'
    },
    charCount: {
        fontSize: '12px',
        color: '#9ca3af',
        fontWeight: 400
    },
    textarea: {
        width: '100%',
        padding: '12px',
        fontSize: '14px',
        borderRadius: '6px',
        border: '1px solid #d1d5db',
        resize: 'vertical',
        fontFamily: 'monospace',
        boxSizing: 'border-box'
    },
    submitButton: {
        width: '100%',
        padding: '14px 24px',
        fontSize: '16px',
        fontWeight: 600,
        color: '#fff',
        background: '#059669',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        marginTop: '12px'
    },
    text: {
        fontSize: '15px',
        color: '#4b5563',
        lineHeight: 1.6
    },
    scoreBox: {
        textAlign: 'center',
        padding: '24px',
        background: '#f9fafb',
        borderRadius: '12px',
        marginBottom: '24px'
    },
    score: {
        fontSize: '64px',
        fontWeight: 700,
        color: '#111827'
    },
    scoreMax: {
        fontSize: '24px',
        color: '#9ca3af'
    },
    confidence: {
        fontSize: '16px',
        color: '#6b7280',
        marginTop: '8px'
    },
    feedbackBox: {
        background: '#f0fdf4',
        padding: '16px 20px',
        borderRadius: '8px',
        marginBottom: '24px'
    },
    disclaimer: {
        fontSize: '13px',
        color: '#9ca3af',
        textAlign: 'center',
        fontStyle: 'italic'
    }
};
