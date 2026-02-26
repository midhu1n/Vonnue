"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion, useMotionValue, useMotionTemplate, useAnimationFrame } from "framer-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Check, Edit2 } from "lucide-react"
import { Source_Sans_3 } from "next/font/google"

const sourceSans = Source_Sans_3({ subsets: ["latin"], weight: ["400", "600", "700"] })

interface Option {
    id: string
    title: string
}

interface Criterion {
    id: string
    name: string
    weight: number
    type: "benefit" | "cost"
}

interface DecisionData {
    id: string
    query: string
    options: Option[]
    criteria: Criterion[]
}

const GridPatternSVG = ({ offsetX, offsetY, id }: { offsetX: any; offsetY: any; id: string }) => (
    <svg className="w-full h-full">
        <defs>
            <motion.pattern
                id={id}
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
                x={offsetX}
                y={offsetY}
            >
                <path
                    d="M 40 0 L 0 0 0 40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                    className="text-muted-foreground"
                />
            </motion.pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
)

export default function ScoreInputPage() {
    const params = useParams()
    const router = useRouter()
    const decisionId = params.id as string

    const [decision, setDecision] = useState<DecisionData | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [scores, setScores] = useState<Record<string, Record<string, string>>>({})
    const [savedRows, setSavedRows] = useState<Set<string>>(new Set())
    const [showError, setShowError] = useState(false)
    const [showEvaluationOverlay, setShowEvaluationOverlay] = useState(false)
    const [evaluationProgress, setEvaluationProgress] = useState(0)

    // Infinite Grid state
    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)
    const gridOffsetX = useMotionValue(0)
    const gridOffsetY = useMotionValue(0)

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const { left, top } = e.currentTarget.getBoundingClientRect()
        mouseX.set(e.clientX - left)
        mouseY.set(e.clientY - top)
    }

    useAnimationFrame(() => {
        gridOffsetX.set((gridOffsetX.get() + 0.3) % 40)
        gridOffsetY.set((gridOffsetY.get() + 0.3) % 40)
    })

    const maskImage = useMotionTemplate`radial-gradient(350px circle at ${mouseX}px ${mouseY}px, black, transparent)`

    useEffect(() => {
        const fetchDecision = async () => {
            try {
                const res = await fetch(`/api/decisions/${decisionId}/`)
                if (res.ok) {
                    const data: DecisionData = await res.json()
                    setDecision(data)
                    // Initialize scores grid
                    const initial: Record<string, Record<string, string>> = {}
                    for (const opt of data.options) {
                        initial[opt.id] = {}
                        for (const crit of data.criteria) {
                            initial[opt.id][crit.id] = ""
                        }
                    }
                    setScores(initial)
                }
            } catch (err) {
                console.error("Failed to fetch decision", err)
            } finally {
                setLoading(false)
            }
        }
        if (decisionId) fetchDecision()
    }, [decisionId])

    const updateScore = (optionId: string, criterionId: string, value: string) => {
        setScores(prev => ({
            ...prev,
            [optionId]: {
                ...prev[optionId],
                [criterionId]: value
            }
        }))
    }

    const allFilled = decision
        ? decision.options.every(opt =>
            decision.criteria.every(crit => {
                const val = scores[opt.id]?.[crit.id]
                return val !== undefined && val !== ""
            })
        )
        : false

    const handleSave = async () => {
        if (!decision || !allFilled) return
        setSaving(true)
        setShowEvaluationOverlay(true) // Show the loading blur immediately
        setEvaluationProgress(0)

        // Start the artificial loading animation with staged realistic varying speeds
        const runRandomProgress = () => {
            setEvaluationProgress(prev => {
                if (prev >= 100) return 100;

                let increment, nextTime;

                if (prev < 50) {
                    // 0-50%: Fast initial chunks
                    increment = Math.floor(Math.random() * 6) + 3; // 3-8% steps
                    nextTime = Math.floor(Math.random() * 400) + 300; // 300-700ms delays
                } else if (prev < 76) {
                    // 51-75%: Noticeably slower
                    increment = Math.floor(Math.random() * 3) + 1; // 1-3% steps
                    nextTime = Math.floor(Math.random() * 800) + 800; // 800-1600ms delays
                } else {
                    // 76-100%: Very slow, final wrap-up
                    increment = Math.floor(Math.random() * 2) + 1; // 1-2% steps
                    nextTime = Math.floor(Math.random() * 1200) + 1200; // 1200-2400ms delays
                }

                const nextVal = Math.min(100, prev + increment);

                if (nextVal < 100) {
                    setTimeout(runRandomProgress, nextTime);
                }

                return nextVal;
            });
        };

        // Start the random progression
        setTimeout(runRandomProgress, 200);

        const payload: { option: string; criterion: string; value: number }[] = []
        for (const opt of decision.options) {
            for (const crit of decision.criteria) {
                payload.push({
                    option: opt.id,
                    criterion: crit.id,
                    value: parseFloat(scores[opt.id][crit.id])
                })
            }
        }

        try {
            const res = await fetch(`/api/decisions/${decisionId}/scores/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            })

            // Wait for both the artificial animation to hit 100% AND the fetch to complete
            const checkCompletion = setInterval(() => {
                setEvaluationProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(checkCompletion)
                        if (res.ok) {
                            router.push(`/decision/${decisionId}/results`)
                        } else {
                            setShowEvaluationOverlay(false)
                            setSaving(false)
                            alert("Failed to save scores.")
                        }
                    }
                    return prev
                })
            }, 100)

        } catch (err) {
            console.error(err)
            setShowEvaluationOverlay(false)
            setSaving(false)
            alert("Error saving scores.")
        }
    }

    if (loading) {
        return (
            <section className="min-h-screen flex items-center justify-center bg-background">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-lg text-muted-foreground"
                >
                    Loading...
                </motion.div>
            </section>
        )
    }

    if (!decision || decision.options.length === 0 || decision.criteria.length === 0) {
        return (
            <section className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center space-y-4">
                    <p className="text-lg text-muted-foreground">No options or criteria found for this decision.</p>
                    <Button variant="outline" onClick={() => router.back()}>Go Back</Button>
                </div>
            </section>
        )
    }

    return (
        <section
            onMouseMove={handleMouseMove}
            className="relative w-full min-h-[100vh] flex flex-col items-center justify-start px-4 md:px-8 py-16 overflow-hidden bg-background"
        >
            {/* Infinite Grid - base layer */}
            <div className="absolute inset-0 z-0 opacity-[0.05]">
                <GridPatternSVG offsetX={gridOffsetX} offsetY={gridOffsetY} id="grid-base" />
            </div>

            {/* Infinite Grid - mouse-tracking reveal layer */}
            <motion.div
                className="absolute inset-0 z-0 opacity-40"
                style={{ maskImage, WebkitMaskImage: maskImage }}
            >
                <GridPatternSVG offsetX={gridOffsetX} offsetY={gridOffsetY} id="grid-reveal" />
            </motion.div>
            {/* Loading Overlay */}
            {showEvaluationOverlay && (
                <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#070707] transition-duration-300">
                    <div className="relative flex flex-col items-center gap-8">
                        <motion.h2
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={cn(sourceSans.className, "text-3xl md:text-4xl font-normal text-white/90 tracking-wide text-center")}
                        >
                            {evaluationProgress < 50 ? "Evaluating..." : evaluationProgress < 75 ? "Ranking..." : "Loading your Result..."}
                        </motion.h2>

                        <div className="relative flex flex-col items-center justify-center space-y-8">
                            {/* Waveform Equalizer Animation */}
                            <div className="flex items-center justify-center mt-4 h-24">
                                <div className="flex items-center space-x-2.5">
                                    {[
                                        { h: "h-6", d: 0 },
                                        { h: "h-10", d: 0.15 },
                                        { h: "h-14", d: 0.3 },
                                        { h: "h-20", d: 0.45 },
                                        { h: "h-14", d: 0.6 },
                                        { h: "h-10", d: 0.75 },
                                        { h: "h-6", d: 0.9 },
                                    ].map((bar, i) => (
                                        <motion.div
                                            key={i}
                                            className={`w-3.5 rounded-full bg-[#f42b2d] ${bar.h}`}
                                            animate={{
                                                scaleY: [1, 1.6, 1],
                                            }}
                                            transition={{
                                                duration: 1.2,
                                                ease: 'easeInOut',
                                                repeat: Infinity,
                                                delay: bar.d,
                                            }}
                                            style={{ transformOrigin: "center" }}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Percentage Text Below Animation */}
                            <motion.span
                                key={evaluationProgress}
                                initial={{ opacity: 0.5, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-2xl md:text-3xl font-bold text-white/80"
                            >
                                {evaluationProgress}%
                            </motion.span>
                        </div>
                    </div>
                </div>
            )}

            {/* Ambient background */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <motion.div className="absolute right-[-20%] top-[-20%] w-[40%] h-[40%] rounded-full bg-orange-500/40 dark:bg-orange-600/20 blur-[120px]" />
                <div className="absolute right-[10%] top-[-10%] w-[20%] h-[20%] rounded-full bg-primary/30 blur-[100px]" />
                <div className="absolute left-[-10%] bottom-[-20%] w-[40%] h-[40%] rounded-full bg-blue-500/40 dark:bg-blue-600/20 blur-[120px]" />
            </div>

            <div className="relative z-10 w-full max-w-6xl">
                {/* Header */}
                <div className="flex flex-col items-center justify-center mb-12 mt-8 text-center">
                    <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-4 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-200 dark:to-white">
                        Rate Your Options
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mt-2">
                        <strong className="text-xl text-indigo-600 dark:text-indigo-400 font-bold tracking-wide">
                            Enter Values for Each Criteria.
                        </strong>
                        <span className="opacity-90 ml-2">
                            Fill in scores for each option across all attributes you defined.
                        </span>
                    </p>
                </div>

                {/* Score Table */}
                <div className="border-2 border-black dark:border-white rounded-xl mb-4 overflow-hidden bg-white/60 dark:bg-black/60 backdrop-blur-xl shadow-[8px_8px_0px_rgba(0,0,0,0.1)] dark:shadow-[8px_8px_0px_rgba(255,255,255,0.05)] ring-1 ring-black/5 dark:ring-white/5">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-gray-100/90 dark:bg-gray-900/90 border-b-2 border-black dark:border-white">
                                    <th className="text-left px-6 py-4 font-semibold text-sm uppercase tracking-wider text-gray-700 dark:text-gray-300 border-r border-gray-300 dark:border-gray-700 min-w-[180px]">
                                        Options
                                    </th>
                                    {decision.criteria.map(crit => (
                                        <th
                                            key={crit.id}
                                            className="text-center px-6 py-4 font-semibold text-sm uppercase tracking-wider text-gray-700 dark:text-gray-300 border-r border-gray-300 dark:border-gray-700 last:border-r-0 min-w-[140px]"
                                        >
                                            <div className="flex flex-col items-center gap-1">
                                                <span>{crit.name}</span>
                                            </div>
                                        </th>
                                    ))}
                                    <th className="text-center px-6 py-4 font-semibold text-sm uppercase tracking-wider text-gray-700 dark:text-gray-300 min-w-[120px]">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {decision.options.map((opt, rowIdx) => (
                                    <motion.tr
                                        key={opt.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: rowIdx * 0.05 }}
                                        className={cn(
                                            "border-b border-gray-300 dark:border-gray-700 last:border-b-0 transition-colors",
                                            "hover:bg-gray-50/80 dark:hover:bg-gray-900/80"
                                        )}
                                    >
                                        <td className="px-6 py-4 border-r border-gray-300 dark:border-gray-700">
                                            <div className="flex items-center gap-3">
                                                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 text-xs font-bold shrink-0">
                                                    {rowIdx + 1}
                                                </span>
                                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                                    {opt.title}
                                                </span>
                                            </div>
                                        </td>
                                        {decision.criteria.map(crit => {
                                            const isRowLocked = rowIdx > 0 && !savedRows.has(decision.options[rowIdx - 1].id)

                                            return (
                                                <td
                                                    key={crit.id}
                                                    className={`px-4 py-4 border-r border-gray-300 dark:border-gray-700 last:border-r-0 ${isRowLocked ? 'opacity-50 select-none' : ''}`}
                                                >
                                                    {savedRows.has(opt.id) ? (
                                                        <span className="font-mono text-sm text-gray-900 dark:text-gray-100 block text-center">{scores[opt.id]?.[crit.id] ?? ""}</span>
                                                    ) : (
                                                        <Input
                                                            type="number"
                                                            step="any"
                                                            min="0"
                                                            value={scores[opt.id]?.[crit.id] ?? ""}
                                                            onChange={(e) => updateScore(opt.id, crit.id, e.target.value)}
                                                            placeholder={
                                                                rowIdx === 0
                                                                    ? (crit.type === "cost"
                                                                        ? "e.g. 85000"
                                                                        : /price/i.test(crit.name) ? "e.g. 75000"
                                                                            : /battery/i.test(crit.name) ? "e.g. 15 hrs"
                                                                                : /ram|memory|storage/i.test(crit.name) ? "e.g. 16 GB"
                                                                                    : /speed|clock/i.test(crit.name) ? "e.g. 3.5 GHz"
                                                                                        : /weight|mass/i.test(crit.name) ? "e.g. 1.4 kg"
                                                                                            : "e.g. 8 / 10")
                                                                    : ""
                                                            }
                                                            disabled={isRowLocked}
                                                            className={`h-10 text-center font-mono text-sm border-gray-200 dark:border-gray-700 focus:border-indigo-500 focus:ring-indigo-500 bg-transparent w-full ${isRowLocked ? 'cursor-not-allowed bg-gray-100/50 dark:bg-gray-800/50' : ''}`}
                                                        />
                                                    )}
                                                </td>
                                            )
                                        })}
                                        <td className={`px-4 py-4 text-center ${rowIdx > 0 && !savedRows.has(decision.options[rowIdx - 1].id) ? 'opacity-50' : ''}`}>
                                            {savedRows.has(opt.id) ? (
                                                <Button variant="outline" size="sm" onClick={() => {
                                                    setSavedRows(prev => { const next = new Set(prev); next.delete(opt.id); return next; });
                                                    setShowError(false); // Clear error on edit
                                                }} className="h-8">
                                                    <Edit2 className="h-4 w-4 mr-1" /> Edit
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={rowIdx > 0 && !savedRows.has(decision.options[rowIdx - 1].id)}
                                                    onClick={() => {
                                                        const rowFilled = decision.criteria.every(c => {
                                                            const val = scores[opt.id]?.[c.id];
                                                            return val !== undefined && val !== "";
                                                        });
                                                        if (!rowFilled) { alert("Please fill all values before saving."); return; }

                                                        setSavedRows(prev => {
                                                            const next = new Set(prev).add(opt.id);
                                                            // If all rows are now saved, clear the error
                                                            if (next.size === decision.options.length) setShowError(false);
                                                            return next;
                                                        });
                                                    }}
                                                    className={`h-8 ${rowIdx > 0 && !savedRows.has(decision.options[rowIdx - 1].id) ? 'cursor-not-allowed' : ''}`}
                                                >
                                                    <Check className="h-4 w-4 mr-1" /> Save
                                                </Button>
                                            )}
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Error Message Below Table */}
                {showError && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full flex justify-center mb-6"
                    >
                        <div className="bg-red-500 text-white px-5 py-2.5 rounded-full font-semibold shadow-md flex items-center gap-2 text-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" /></svg>
                            Please save all the values before evaluating.
                        </div>
                    </motion.div>
                )}

                {/* Info + Submit */}
                <div className="flex items-center justify-end gap-6 mb-12">
                    {/* Added error banner state */}
                    <Button
                        onClick={() => {
                            if (savedRows.size !== decision.options.length) {
                                setShowError(true);
                                return;
                            }
                            handleSave()
                        }}
                        disabled={saving}
                        className="bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 px-8 py-4 rounded-lg text-base font-bold shadow-md hover:shadow-xl transition-all uppercase tracking-wide"
                    >
                        {saving ? "Saving..." : "Evaluate"}
                    </Button>
                </div>

                {/* Need Help */}
                <div className="flex justify-center pb-8">
                    <button onClick={() => console.log('Need help clicked')} className="group flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors">
                        <span className="underline underline-offset-4 decoration-gray-300 dark:decoration-gray-700 group-hover:decoration-current transition-colors">
                            Need help?
                        </span>
                    </button>
                </div>
            </div>
        </section>
    )
}
