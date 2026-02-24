"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion, useMotionValue, useMotionTemplate, useAnimationFrame } from "framer-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Check, Edit2 } from "lucide-react"

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
    // scores: { [optionId]: { [criterionId]: value } }
    const [scores, setScores] = useState<Record<string, Record<string, string>>>({})
    const [savedRows, setSavedRows] = useState<Set<string>>(new Set())

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
            if (res.ok) {
                // Navigate to step 5 (evaluation results) — placeholder for now
                router.push(`/decision/${decisionId}/results`)
            } else {
                alert("Failed to save scores.")
            }
        } catch (err) {
            console.error(err)
            alert("Error saving scores.")
        } finally {
            setSaving(false)
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

            {/* Gradient orbs */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute right-[-20%] top-[-20%] w-[40%] h-[40%] rounded-full bg-orange-500/40 dark:bg-orange-600/20 blur-[120px]" />
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
                <div className="border-2 border-black dark:border-white rounded-xl mb-8 overflow-hidden bg-white/60 dark:bg-black/60 backdrop-blur-xl shadow-[8px_8px_0px_rgba(0,0,0,0.1)] dark:shadow-[8px_8px_0px_rgba(255,255,255,0.05)] ring-1 ring-black/5 dark:ring-white/5">
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
                                        {decision.criteria.map(crit => (
                                            <td
                                                key={crit.id}
                                                className="px-4 py-4 border-r border-gray-300 dark:border-gray-700 last:border-r-0"
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
                                                        className="h-10 text-center font-mono text-sm border-gray-200 dark:border-gray-700 focus:border-indigo-500 focus:ring-indigo-500 bg-transparent w-full"
                                                    />
                                                )}
                                            </td>
                                        ))}
                                        <td className="px-4 py-4 text-center">
                                            {savedRows.has(opt.id) ? (
                                                <Button variant="outline" size="sm" onClick={() => setSavedRows(prev => { const next = new Set(prev); next.delete(opt.id); return next; })} className="h-8">
                                                    <Edit2 className="h-4 w-4 mr-1" /> Edit
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        const rowFilled = decision.criteria.every(c => {
                                                            const val = scores[opt.id]?.[c.id];
                                                            return val !== undefined && val !== "";
                                                        });
                                                        if (!rowFilled) { alert("Please fill all values before saving."); return; }
                                                        setSavedRows(prev => new Set(prev).add(opt.id));
                                                    }}
                                                    className="h-8"
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

                {/* Info + Submit */}
                <div className="flex items-center justify-end gap-6 mb-12">

                    <Button
                        onClick={handleSave}
                        disabled={!allFilled || saving}
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
