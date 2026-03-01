"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useLoader } from "@/context/loader-context"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ChevronRight, Info } from "lucide-react"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from "recharts"

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
    type: 'benefit' | 'cost'
}

interface CalculatedOption extends Option {
    normalizedScores: { [key: string]: number }
    totalScore: number
}

interface DecisionData {
    query: string
    criteria: Criterion[]
    options: Option[]
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

export default function AnalysisPage() {
    const params = useParams()
    const { navigate, startLoading } = useLoader()
    const decisionId = params.id as string

    const [decision, setDecision] = useState<DecisionData | null>(null)
    const [evaluatedOptions, setEvaluatedOptions] = useState<CalculatedOption[]>([])
    const [error, setError] = useState<string | null>(null)
    const [explanation, setExplanation] = useState<string>("")

    useEffect(() => {
        const fetchDecisionData = async () => {
            if (!decisionId) return

            try {
                startLoading()
                const response = await fetch(`/api/decisions/${decisionId}/`)

                if (!response.ok) {
                    throw new Error('Failed to load decision data')
                }

                const data: DecisionData = await response.json()

                setDecision(data)
                calculateScores(data)
            } catch (err) {
                console.error("Error fetching data:", err)
                setError(err instanceof Error ? err.message : 'An error occurred')
            }
        }

        fetchDecisionData()
    }, [decisionId])

    const calculateScores = (data: DecisionData) => {
        const { criteria, options } = data
        let evaluated: CalculatedOption[] = []

        options.forEach(option => {
            let totalScore = 0
            const normalizedScores: { [key: string]: number } = {}

            criteria.forEach(criterion => {
                const scoreObj = option.scores.find(s => s.criterion === criterion.id)
                const rawScore = scoreObj ? scoreObj.value : 0

                // Find min/max for this criterion across ALL options
                const allScoresForCrit = options.map(o => {
                    const s = o.scores.find(sc => sc.criterion === criterion.id)
                    return s ? s.value : 0
                })
                const min = Math.min(...allScoresForCrit)
                const max = Math.max(...allScoresForCrit)

                let normalizedScore = 0
                if (max === min) {
                    normalizedScore = 1
                } else if (criterion.type === 'benefit') {
                    normalizedScore = (rawScore - min) / (max - min)
                } else {
                    normalizedScore = (max - rawScore) / (max - min)
                }

                normalizedScores[criterion.id] = normalizedScore
                totalScore += normalizedScore * criterion.weight
            })

            evaluated.push({
                ...option,
                normalizedScores,
                totalScore
            })
        })

        // Sort descending
        evaluated.sort((a, b) => b.totalScore - a.totalScore)
        setEvaluatedOptions(evaluated)
        generateExplanation(evaluated, criteria)
    }

    const generateExplanation = (sortedOptions: CalculatedOption[], criteria: Criterion[]) => {
        if (sortedOptions.length < 2) {
            setExplanation(`${sortedOptions[0]?.title} is the only option available.`)
            return
        }

        const top = sortedOptions[0]
        const second = sortedOptions[1]

        // Find biggest advantage of top over second
        let biggestAdvantageCrit = criteria[0]
        let maxDiff = -Infinity

        criteria.forEach(c => {
            const diff = (top.normalizedScores[c.id] - second.normalizedScores[c.id]) * c.weight
            if (diff > maxDiff) {
                maxDiff = diff
                biggestAdvantageCrit = c
            }
        })

        // Find biggest advantage of second over top
        let biggestDisadvantageCrit = criteria[0]
        let maxNegDiff = -Infinity

        criteria.forEach(c => {
            const diff = (second.normalizedScores[c.id] - top.normalizedScores[c.id]) * c.weight
            if (diff > maxNegDiff) {
                maxNegDiff = diff
                biggestDisadvantageCrit = c
            }
        })

        if (maxDiff <= 0) {
            setExplanation(`${top.title} is recommended because it performs consistently well across all metrics.`)
            return
        }

        let expl = `${top.title} is recommended because it excelled in '${biggestAdvantageCrit.name}' (Weight: ${Math.round(biggestAdvantageCrit.weight * 100)}%) where it scored ${(top.normalizedScores[biggestAdvantageCrit.id]).toFixed(2)}.`

        if (maxNegDiff > 0 && biggestAdvantageCrit.id !== biggestDisadvantageCrit.id) {
            expl += ` Although ${second.title} was better in '${biggestDisadvantageCrit.name}' (Weight: ${Math.round(biggestDisadvantageCrit.weight * 100)}%), the high importance you placed on '${biggestAdvantageCrit.name}' outweighed those benefits.`
        }

        if (sortedOptions.length > 2) {
            expl += ` Meanwhile, other options like ${sortedOptions[sortedOptions.length - 1].title} fell significantly behind due to lower comprehensive scoring.`
        }

        setExplanation(expl)
    }

    if (error) {
        return (
            <div className="min-h-screen w-full bg-[#1F2023] text-white flex items-center justify-center">
                <div className="text-center space-y-4">
                    <p className="text-red-400">{error}</p>
                    <Button onClick={() => window.location.reload()} variant="outline" className="border-white/10">
                        Try Again
                    </Button>
                </div>
            </div>
        )
    }

    if (!decision) return null

    // Prepare bar chart data (Attribute Weights)
    const barChartData = decision.criteria.map(c => ({
        name: c.name,
        weight: c.weight
    }))

    // Prepare pie chart data (Total Score Contribution)
    const pieChartData = evaluatedOptions.map(opt => ({
        name: opt.title,
        score: Number(opt.totalScore.toFixed(3))
    }))

    return (
        <div className="min-h-[100dvh] w-full bg-[#1F2023] text-gray-100 font-sans p-4 md:p-8 flex flex-col pt-32 h-full relative overflow-hidden group/page">

            {/* Movable Sidebar Indicator */}
            <div className="fixed left-0 top-1/2 -translate-y-1/2 z-40 p-2 bg-indigo-600/20 backdrop-blur-md rounded-r-xl border border-indigo-500/30 border-l-0 text-white opacity-60 group-hover/page:opacity-0 transition-opacity duration-300 cursor-pointer pointer-events-none">
                <ChevronRight className="w-6 h-6 animate-pulse" />
            </div>

            {/* Movable Sidebar */}
            <div className="fixed left-0 top-0 h-full w-64 bg-[#141517]/95 backdrop-blur-xl border-r border-white/10 z-50 transform -translate-x-full hover:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col pt-8 pb-4 px-4 shadow-[10px_0_30px_rgba(0,0,0,0.5)] group-hover/page:-translate-x-[calc(100%-12px)] [&:hover]:!-translate-x-0">
                <div className="absolute right-[-12px] top-0 bottom-0 w-3 cursor-ew-resize opacity-0" />
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
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#9b87f5]/20 blur-[120px] pointer-events-none" />
            <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] rounded-full bg-orange-500/10 blur-[120px] pointer-events-none" />

            <div className="max-w-6xl mx-auto w-full relative z-10 flex flex-col gap-8 pb-12">

                {/* Title */}
                <div className="flex flex-col items-start justify-start border-b border-white/10 pb-6 gap-2 relative">
                    <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white capitalize">{decision.query}</h1>
                    <p className="text-white/50 text-lg font-medium">Decision Analysis</p>
                </div>

                {/* Grid Layout for the 4 sections */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Section 1: Detailed Table */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="col-span-1 lg:col-span-2 bg-[#141517] border border-white/10 rounded-2xl p-6 shadow-xl overflow-x-auto"
                    >
                        <h2 className="text-xl font-semibold mb-4">Normalized Scores Breakdown</h2>
                        <table className="w-full text-left border-collapse whitespace-nowrap">
                            <thead>
                                <tr className="border-b border-white/10 text-white/50 text-sm">
                                    <th className="p-4 font-medium">Option</th>
                                    {decision.criteria.map(crit => (
                                        <th key={crit.id} className="p-4 font-medium">
                                            {crit.name} <span className="text-xs text-indigo-400 block">Weight: {crit.weight.toFixed(2)}</span>
                                        </th>
                                    ))}
                                    <th className="p-4 font-medium text-white">Final Score</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {evaluatedOptions.map((opt, idx) => (
                                    <tr key={opt.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="p-4 font-semibold text-white">
                                            <div className="flex flex-col">
                                                <span>{opt.title}</span>
                                                {idx === 0 && <span className="text-xs text-green-400 font-bold">Rank 1</span>}
                                            </div>
                                        </td>
                                        {decision.criteria.map(crit => {
                                            const scoreObj = opt.scores.find(s => s.criterion === crit.id);
                                            const rawScale = scoreObj ? scoreObj.value : 0;
                                            const normScale = opt.normalizedScores[crit.id] || 0;
                                            return (
                                                <td key={crit.id} className="p-4 text-white/80">
                                                    <div>{normScale.toFixed(2)} (Norm)</div>
                                                    <div className="text-xs text-white/40">Raw: {rawScale}</div>
                                                </td>
                                            )
                                        })}
                                        <td className="p-4 font-mono text-white font-bold">{opt.totalScore.toFixed(3)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </motion.div>

                    {/* Section 2: Bar Chart */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="bg-[#141517] border border-white/10 rounded-2xl p-6 shadow-xl h-[400px] flex flex-col"
                    >
                        <h2 className="text-xl font-semibold mb-6">Attribute Weights</h2>
                        <div className="flex-1 w-full min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} />
                                    <YAxis stroke="rgba(255,255,255,0.5)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} domain={[0, 1]} />
                                    <RechartsTooltip
                                        contentStyle={{ backgroundColor: '#1F2023', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Bar dataKey="weight" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    {/* Section 3: Pie Chart */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="bg-[#141517] border border-white/10 rounded-2xl p-6 shadow-xl h-[400px] flex flex-col"
                    >
                        <h2 className="text-xl font-semibold mb-2">Total Score Contribution</h2>
                        <div className="flex-1 w-full min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieChartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="score"
                                    >
                                        {pieChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip
                                        contentStyle={{ backgroundColor: '#1F2023', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex flex-wrap gap-3 justify-center mt-4">
                            {pieChartData.map((entry, index) => (
                                <div key={entry.name} className="flex items-center gap-1.5 text-xs text-white/70">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                    <span>{entry.name}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Section 4: Explanation generator (reused from results but stylized diff) */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="col-span-1 lg:col-span-2 bg-[#141517] border border-indigo-500/30 rounded-2xl p-6 shadow-[0_0_30px_rgba(99,102,241,0.1)] flex gap-4 items-start"
                    >
                        <Info className="w-6 h-6 text-indigo-400 shrink-0 mt-1" />
                        <div>
                            <h2 className="text-lg font-bold text-white mb-2">Conclusion</h2>
                            <p className="text-white/80 leading-relaxed text-sm">
                                {explanation}
                            </p>
                        </div>
                    </motion.div>

                </div>
            </div>
        </div>
    )
}
