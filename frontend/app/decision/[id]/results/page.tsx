"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useLoader } from "@/context/loader-context"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download, Info, X, ChevronRight } from "lucide-react"

interface Score {
    id: string
    criterion: string
    value: number
}

interface Option {
    id: string
    title: string
    scores: Score[]
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
    criteria: Criterion[]
    options: Option[]
}

// Result structure to hold calculated values
interface EvaluatedOption extends Option {
    normalizedScores: Record<string, number>
    totalScore: number
}

export default function ResultsPage() {
    const params = useParams()
    const router = useRouter()
    const { navigate } = useLoader()
    const decisionId = params?.id as string

    const [decision, setDecision] = useState<DecisionData | null>(null)
    const [evaluatedOptions, setEvaluatedOptions] = useState<EvaluatedOption[]>([])
    const [loading, setLoading] = useState(true)
    const [calculationModal, setCalculationModal] = useState<EvaluatedOption | null>(null)

    useEffect(() => {
        if (!decisionId) return
        fetchDecision()
    }, [decisionId])

    const fetchDecision = async () => {
        try {
            const res = await fetch(`/api/decisions/${decisionId}/`)
            if (!res.ok) throw new Error("Failed to fetch decision")
            const data: DecisionData = await res.json()
            setDecision(data)
            calculateResults(data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const calculateResults = (data: DecisionData) => {
        if (!data.criteria.length || !data.options.length) {
            setEvaluatedOptions([])
            return
        }

        // Helper to calculate percentile
        const getPercentile = (values: number[], percentile: number) => {
            if (values.length === 0) return 0;
            const sorted = [...values].sort((a, b) => a - b);
            const index = (percentile / 100) * (sorted.length - 1);
            const lower = Math.floor(index);
            const upper = Math.ceil(index);
            const weight = index % 1;
            if (lower === upper) return sorted[lower];
            return sorted[lower] * (1 - weight) + sorted[upper] * weight;
        };

        // 1. Find Min, Max, and Percentiles for each criterion
        const stats: Record<string, { min: number, max: number, p5: number, p95: number }> = {}
        data.criteria.forEach(crit => {
            const values = data.options.map(opt => {
                const scoreObj = opt.scores.find(s => s.criterion === crit.id)
                return scoreObj ? scoreObj.value : 0
            })

            const n = values.length;
            const trueMin = Math.min(...values);
            const trueMax = Math.max(...values);

            // If dataset is very small (N < 5), fallback to true Min/Max to avoid weird percentile banding
            let p5 = getPercentile(values, 5);
            let p95 = getPercentile(values, 95);

            if (n < 5) {
                p5 = trueMin;
                p95 = trueMax;
            }

            stats[crit.id] = { min: trueMin, max: trueMax, p5, p95 }
        })

        // 2. Normalize using [0.1, 1.0] bounded robust scaling and compute WSM Score
        let results: EvaluatedOption[] = data.options.map(opt => {
            let totalScore = 0;
            const normalizedScores: Record<string, number> = {}

            data.criteria.forEach(crit => {
                const scoreObj = opt.scores.find(s => s.criterion === crit.id)
                const rawValue = scoreObj ? scoreObj.value : 0
                const { p5, p95 } = stats[crit.id]

                let n = 0;

                // Avoid division by zero, award top score if range is 0
                if (p95 === p5) {
                    n = 1.0;
                } else {
                    // Cap the raw value to the percentiles to ignore extreme outliers
                    const capped = Math.min(Math.max(rawValue, p5), p95);

                    if (crit.type === "cost") {
                        n = 0.1 + 0.9 * (p95 - capped) / (p95 - p5);
                    } else {
                        // Benefit
                        n = 0.1 + 0.9 * (capped - p5) / (p95 - p5);
                    }
                }

                normalizedScores[crit.id] = n;
                totalScore += (n * crit.weight);
            })

            return {
                ...opt,
                normalizedScores,
                totalScore
            }
        })

        // 3. Sort by total score descending
        results.sort((a, b) => b.totalScore - a.totalScore)
        setEvaluatedOptions(results)
    }

    const generateExplanation = () => {
        if (evaluatedOptions.length === 0) return "No data to analyze."
        if (evaluatedOptions.length === 1) return `The ${evaluatedOptions[0].title} is the clear winner as it's the only option!`

        const winner = evaluatedOptions[0]
        const runnerUp = evaluatedOptions[1]

        let bestCritForWinner: Criterion | null = null
        let maxWinnerAdvantage = -1

        let bestCritForRunnerUp: Criterion | null = null
        let maxRunnerUpAdvantage = -1

        for (const crit of decision!.criteria) {
            const wScore = winner.normalizedScores[crit.id] * crit.weight
            const rScore = runnerUp.normalizedScores[crit.id] * crit.weight

            // Look at raw normalized scores (0 to 1) for the text description
            const wNorm = winner.normalizedScores[crit.id]
            const rNorm = runnerUp.normalizedScores[crit.id]

            const diff = wScore - rScore

            if (diff > maxWinnerAdvantage) {
                maxWinnerAdvantage = diff
                bestCritForWinner = crit
            }

            // Negative diff means runner up did better here
            if (diff < 0 && Math.abs(diff) > maxRunnerUpAdvantage) {
                maxRunnerUpAdvantage = Math.abs(diff)
                bestCritForRunnerUp = crit
            }
        }

        if (!bestCritForWinner) {
            return `Result: The ${winner.title} narrowly beats the ${runnerUp.title} with a solid overall performance.`
        }

        const wScoreText = winner.normalizedScores[bestCritForWinner!.id].toFixed(2)
        const weightText = Math.round(bestCritForWinner!.weight * 100)

        let explanation = `${winner.title} is recommended because it excelled in '${bestCritForWinner!.name}' (Weight: ${weightText}%) where it scored ${wScoreText}. `

        if (bestCritForRunnerUp) {
            const runnerWeightText = Math.round(bestCritForRunnerUp.weight * 100)
            explanation += `Although ${runnerUp.title} was better in '${bestCritForRunnerUp.name}' (Weight: ${runnerWeightText}%), the high importance you placed on '${bestCritForWinner!.name}' outweighed those benefits. `
        }

        if (evaluatedOptions.length > 2) {
            const remaining = evaluatedOptions.slice(2).map(o => o.title).join(", ")
            explanation += `Meanwhile, other options like ${remaining} fell significantly behind due to lower comprehensive scoring.`
        }

        return explanation
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
                <p>Loading results...</p>
            </div>
        )
    }

    if (!decision) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center flex-col gap-4">
                <p>Decision not found.</p>
                <Button variant="outline" onClick={() => navigate("/", { showLoader: false })}>Go Home</Button>
            </div>
        )
    }

    return (
        <div className="min-h-[100dvh] w-full bg-[#1F2023] print:bg-white text-gray-100 print:text-black font-sans p-4 md:p-8 print:p-0 flex flex-col pt-32 print:pt-0 h-full relative overflow-hidden print:overflow-visible group/page">

            {/* Movable Sidebar Indicator */}
            <div className="fixed left-0 top-1/2 -translate-y-1/2 z-40 p-2 bg-indigo-600/20 backdrop-blur-md rounded-r-xl border border-indigo-500/30 border-l-0 text-white opacity-60 group-hover/page:opacity-0 transition-opacity duration-300 print:hidden cursor-pointer pointer-events-none">
                <ChevronRight className="w-6 h-6 animate-pulse" />
            </div>

            {/* Movable Sidebar */}
            <div className="fixed left-0 top-0 h-full w-64 bg-[#141517]/95 backdrop-blur-xl border-r border-white/10 z-50 transform -translate-x-full hover:translate-x-0 transition-transform duration-300 ease-in-out print:hidden flex flex-col pt-8 pb-4 px-4 shadow-[10px_0_30px_rgba(0,0,0,0.5)] group-hover/page:-translate-x-[calc(100%-12px)] [&:hover]:!-translate-x-0">
                <div className="absolute right-[-12px] top-0 bottom-0 w-3 cursor-ew-resize opacity-0" /> {/* Hit area for hover */}
                <div className="flex items-center gap-2 mb-10 px-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                        <span className="font-bold text-lg">D</span>
                    </div>
                    <span className="font-bold text-lg tracking-wide">Decision Pro</span>
                </div>

                <div className="flex flex-col gap-2 flex-1">
                    <span className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2 px-2">Navigation</span>
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-white/70 hover:text-white hover:bg-white/10"
                        onClick={() => navigate(`/decision/${decisionId}/results`, { showLoader: false })}
                    >
                        Results
                    </Button>
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-white/70 hover:text-white hover:bg-white/10"
                        onClick={() => navigate(`/decision/${decisionId}/analysis`, { showLoader: false })}
                    >
                        Analysis
                    </Button>
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-white/70 hover:text-white hover:bg-white/10 mt-4"
                        onClick={() => navigate('/', { showLoader: false })}
                    >
                        New Decision
                    </Button>
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-white/70 hover:text-white hover:bg-white/10"
                        onClick={() => navigate(`/decision/${decisionId}/options`, { showLoader: false })}
                    >
                        Edit Options
                    </Button>
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-white/70 hover:text-white hover:bg-white/10"
                        onClick={() => navigate(`/decision/${decisionId}/evaluate`, { showLoader: false })}
                    >
                        Edit Scores
                    </Button>
                </div>


            </div>
            {/* Ambient Background Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#9b87f5]/20 blur-[120px] pointer-events-none print:hidden" />
            <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none print:hidden" />
            <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] rounded-full bg-orange-500/10 blur-[120px] pointer-events-none print:hidden" />

            <div className="max-w-6xl mx-auto w-full print:max-w-[700px] relative z-10">

                {/* Header Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4 w-full px-4 print:hidden">
                    <div className="flex items-center gap-6">
                        <Button
                            variant="ghost"
                            className="text-white/60 hover:text-white hover:bg-transparent p-0 h-auto flex items-center gap-2 group"
                            onClick={() => navigate(`/decision/${decisionId}/evaluate`, { showLoader: false })}
                        >
                            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                            Back
                        </Button>

                        <Button
                            variant="ghost"
                            className="text-white/60 hover:text-white hover:bg-transparent p-0 h-auto flex items-center gap-2"
                            onClick={() => navigate(`/decision/${decisionId}/options`, { showLoader: false })}
                        >
                            Back to Scoring
                        </Button>
                    </div>

                    <Button
                        variant="default"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-500/50 shadow-lg shadow-indigo-500/20 rounded-full px-6 transition-all"
                        onClick={() => navigate('/', { showLoader: false })}
                    >
                        + New Decision
                    </Button>
                </div>

                {/* Title */}
                <div className="flex flex-col items-center justify-center mb-12 border-b border-white/10 print:border-black/10 pb-6 gap-4 text-center relative">
                    <div className="mt-4 md:mt-0">
                        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white print:text-black capitalize">{decision.query}</h1>
                        <p className="text-white/50 print:text-black/50 mt-3 text-lg font-medium">Final Ranking</p>
                    </div>
                </div>


                {/* Results Table */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="overflow-x-auto print:overflow-visible bg-[#1F2023] print:bg-white border border-[#444444] print:border-gray-200 shadow-[0_8px_30px_rgba(0,0,0,0.24)] print:shadow-none rounded-2xl md:rounded-3xl print:rounded-none"
                >
                    <table className="w-full text-left border-collapse whitespace-nowrap print:whitespace-normal print:break-words print:text-xs">
                        <thead>
                            <tr className="border-b border-white/10 print:border-gray-200 text-white/50 print:text-gray-500 text-sm divide-x divide-white/10 print:divide-gray-200">
                                <th className="p-4 md:p-6 print:p-2 font-medium text-center w-16 print:w-auto">Rank</th>
                                <th className="p-4 md:p-6 print:p-2 font-medium">Option</th>
                                {decision.criteria.map(crit => (
                                    <th key={crit.id} className="p-4 md:p-6 print:p-2 font-medium">
                                        {crit.name}<br />
                                        <span className="text-xs text-white/30 print:text-gray-400">(Norm) W:{crit.weight}</span>
                                    </th>
                                ))}
                                <th className="p-4 md:p-6 print:p-2 font-medium text-white print:text-black">Total Weighted Score</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10 print:divide-gray-200">
                            {evaluatedOptions.map((opt, idx) => (
                                <tr key={opt.id} className="hover:bg-white/[0.02] print:hover:bg-transparent transition-colors divide-x divide-white/10 print:divide-gray-200">
                                    <td className="p-4 md:p-6 print:p-2 font-bold text-center text-white/80 print:text-gray-700">
                                        {idx + 1}
                                    </td>
                                    <td className="p-4 md:p-6 print:p-2 font-semibold text-white print:text-black">
                                        <div className="flex flex-col gap-1.5 items-start">
                                            <span>{opt.title}</span>
                                            {idx === 0 && (
                                                <span className="text-xs text-green-400 font-bold flex items-center">
                                                    (Recommended)
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    {decision.criteria.map(crit => (
                                        <td key={crit.id} className="p-4 md:p-6 print:p-2 text-white/80 print:text-gray-700">
                                            {opt.normalizedScores[crit.id].toFixed(2)}
                                        </td>
                                    ))}
                                    <td className="p-4 md:p-6 print:p-2 font-mono text-sm text-white/60 print:text-gray-600">
                                        <div className="flex items-center gap-3">
                                            <strong className="text-white print:text-black text-base">
                                                {opt.totalScore.toFixed(3)}
                                            </strong>
                                            <button
                                                onClick={() => setCalculationModal(opt)}
                                                className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-400/20 focus:bg-blue-400/30 rounded-full transition-all print:hidden"
                                                title="View Calculation Breakdown"
                                            >
                                                <Info className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Winner Explanation Alert */}
                    <div className="p-4 md:p-6 border-t border-[#444444] print:border-gray-200 bg-[#1F2023] print:bg-white rounded-b-2xl md:rounded-b-3xl print:rounded-none flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-start gap-3 w-full md:w-auto">
                            <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                            <p className="text-white/90 print:text-gray-800 leading-relaxed font-medium">
                                {generateExplanation()}
                            </p>
                        </div>
                        <Button
                            variant="secondary"
                            className="bg-white/10 hover:bg-white/20 text-white ml-4 shrink-0 transition-colors print:hidden"
                            onClick={() => window.print()}
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Export
                        </Button>
                    </div>
                </motion.div>

            </div>

            {/* Calculation Modal */}
            {calculationModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 shadow-2xl backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#1F2023] border border-white/10 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200 relative">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-6 border-b border-white/10 pb-4">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Info className="w-5 h-5 text-blue-400" />
                                    Math Calculation
                                </h3>
                                <button
                                    onClick={() => setCalculationModal(null)}
                                    className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="mb-6">
                                <p className="text-white/70 mb-3 text-base">Weighted score breakdown for <strong className="text-white bg-white/10 px-1.5 py-0.5 rounded">{calculationModal.title}</strong>:</p>
                                <div className="font-mono text-[15px] bg-black/40 p-5 rounded-xl border border-white/5 leading-[2.5] overflow-x-auto text-white/80 whitespace-nowrap shadow-inner">
                                    {decision.criteria.map((crit, cIdx) => (
                                        <span key={crit.id}>
                                            (<span className="text-blue-300 font-semibold" title="Normalized Score">{calculationModal.normalizedScores[crit.id].toFixed(2)}</span> &times; <span className="text-purple-300 font-semibold" title="Weight">{crit.weight}</span>)
                                            {cIdx < decision.criteria.length - 1 ? <span className="text-white/40 mx-2">+</span> : <span className="text-white/40 mx-2">=</span>}
                                        </span>
                                    ))}
                                    <strong className="text-green-400 text-lg bg-green-400/10 border border-green-500/20 px-3 py-1 rounded-lg ml-1">
                                        {calculationModal.totalScore.toFixed(3)}
                                    </strong>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4 border-t border-white/10">
                                <Button
                                    onClick={() => setCalculationModal(null)}
                                    variant="secondary"
                                    className="bg-white/10 hover:bg-white/20 text-white transition-colors"
                                >
                                    Close
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
