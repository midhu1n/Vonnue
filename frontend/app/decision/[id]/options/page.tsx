"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useLoader } from "@/context/loader-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowRight, ArrowLeft, Plus, Edit2, Trash2, Sparkles, X } from "lucide-react"
import {
    Table,
    TableBody,
    Cell,
    Column,
    Row,
    TableHeader,
    ResizableTableContainer,
} from "@/components/ui/table"

interface Option {
    id: string
    title: string
}

interface Decision {
    id: string
    query: string
}

interface SummaryContent {
    price: string;
    variants: string;
    offers: string;
    features: string[];
    pros_cons: string[];
}

export default function OptionsPage() {
    const params = useParams()
    const router = useRouter()
    const { navigate } = useLoader()
    const decisionId = params.id as string

    const [options, setOptions] = useState<Option[]>([])
    const [newOption, setNewOption] = useState("")
    const [loading, setLoading] = useState(false)
    const [decision, setDecision] = useState<Decision | null>(null)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [aiSuggestions, setAiSuggestions] = useState<string[]>([])
    const [loadingSuggestions, setLoadingSuggestions] = useState(false)
    const [summaryData, setSummaryData] = useState<{ option: string, data: SummaryContent } | null>(null)
    const [loadingSummaryFor, setLoadingSummaryFor] = useState<string | null>(null)

    useEffect(() => {
        const fetchDecision = async () => {
            try {
                const res = await fetch(`/api/decisions/${decisionId}/`)
                if (res.ok) {
                    const data = await res.json()
                    setDecision(data)
                    setOptions(data.options || [])
                }
            } catch (error) {
                console.error("Failed to fetch decision details", error)
            }
        }

        if (decisionId) {
            fetchDecision()
        }
    }, [decisionId])

    const addOption = async () => {
        if (!newOption.trim()) return

        setLoading(true)
        try {
            const res = await fetch(`/api/decisions/${decisionId}/options/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ decision: decisionId, title: newOption }),
            })

            if (res.ok) {
                const data = await res.json()
                setOptions([...options, data])
                setNewOption("")
            } else {
                console.error("Failed to add option")
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            addOption()
        }
    }

    const fetchAiSuggestions = async () => {
        if (!decision?.query) return

        setLoadingSuggestions(true)
        try {
            const res = await fetch(`/api/ai/suggest-options/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ q: decision.query }),
            })

            if (res.ok) {
                const data = await res.json()
                if (data.options) {
                    setAiSuggestions(data.options)
                }
            } else if (res.status === 503) {
                alert("AI Rate limit reached (Free Tier). Please wait 20 seconds and try again!")
            } else {
                console.error("Failed to fetch AI suggestions")
            }
        } catch (error) {
            console.error("Error fetching AI suggestions", error)
        } finally {
            setLoadingSuggestions(false)
        }
    }

    const fetchSummary = async (suggestion: string) => {
        setLoadingSummaryFor(suggestion)
        try {
            const res = await fetch(`/api/ai/summarize-option/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ decision: decision?.query, option: suggestion }),
            })
            if (res.ok) {
                const data = await res.json()
                setSummaryData({ option: suggestion, data: data.summary })
            } else if (res.status === 503) {
                alert("AI Rate limit reached (Free Tier). Please wait 20 seconds and try again!")
            } else {
                console.error("Failed to fetch summary")
            }
        } catch (error) {
            console.error("Error fetching summary", error)
        } finally {
            setLoadingSummaryFor(null)
        }
    }

    const addAiOption = async (suggestion: string) => {
        setLoading(true)
        try {
            const res = await fetch(`/api/decisions/${decisionId}/options/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ decision: decisionId, title: suggestion }),
            })

            if (res.ok) {
                const data = await res.json()
                setOptions([...options, data])
                // Remove the added suggestion from the list
                setAiSuggestions(aiSuggestions.filter(s => s !== suggestion))
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const updateOptionLocal = (id: string, newTitle: string) => {
        setOptions(options.map(o => o.id === id ? { ...o, title: newTitle } : o))
    }

    const saveOption = async (id: string) => {
        const opt = options.find(o => o.id === id)
        if (!opt?.title.trim()) {
            alert("Option name is required.")
            return
        }
        try {
            await fetch(`/api/options/${id}/`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: opt.title })
            })
        } catch (error) {
            console.error(error)
        }
        setEditingId(null)
    }

    const removeOption = async (id: string) => {
        try {
            await fetch(`/api/options/${id}/`, {
                method: "DELETE"
            })
            setOptions(options.filter(o => o.id !== id))
            if (editingId === id) setEditingId(null)
        } catch (err) {
            console.error(err)
        }
    }

    const placeholder = "Enter your choice here"

    return (
        <main className="relative w-full min-h-screen overflow-hidden bg-background flex items-center justify-center bg-[url('https://raw.githubusercontent.com/prebuiltui/prebuiltui/main/assets/hero/gridBackground.png')] bg-no-repeat bg-cover bg-center">
            <div className="relative z-10 w-full max-w-4xl space-y-8 animate-fade-up p-8">
                <div className="absolute top-8 left-8">
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/', { showLoader: false })}
                        className="group flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all pl-2 pr-4 h-10 rounded-full hover:bg-white/50 dark:hover:bg-gray-800/50 backdrop-blur-sm"
                    >
                        <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                        <span className="font-medium">Back</span>
                    </Button>
                </div>
                <div className="text-center">
                    <h1 className="font-bold text-gray-900 dark:text-white text-balance text-3xl sm:text-4xl md:text-5xl leading-tight sm:leading-tight md:leading-tight lg:leading-tight mb-6">
                        <span className="block text-gray-400 dark:text-gray-500 text-lg md:text-xl mb-2 font-medium tracking-normal">Options for</span>
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                            {decision ? `"${decision.query}"` : "Define Your Options"}
                        </span>
                    </h1>
                    <p className="text-lg sm:text-xl text-gray-700 dark:text-gray-300 text-pretty max-w-2xl mx-auto leading-relaxed mb-6 px-4 font-medium">
                        List the possibilities you are considering. We&apos;ll help you evaluate them next.
                    </p>
                </div>

                <div className="bg-white/80 dark:bg-gray-950/80 backdrop-blur-2xl border-2 border-gray-900 dark:border-gray-800 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] overflow-hidden p-6 md:p-8 relative">
                    <div className="flex gap-4 mb-4 relative z-10">
                        <Input
                            placeholder={editingId ? "Save your edit first..." : placeholder}
                            value={newOption}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewOption(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="flex-1 h-14 text-lg shadow-sm border-2 border-gray-300 dark:border-gray-700 focus:border-gray-900 dark:focus:border-gray-400 focus:ring-gray-900 dark:focus:ring-gray-400 bg-white dark:bg-gray-900 text-center rounded-xl transition-all"
                            autoFocus
                            disabled={editingId !== null}
                        />
                        <Button
                            onClick={addOption}
                            disabled={loading || !newOption.trim() || editingId !== null}
                            size="lg"
                            className="h-14 px-8 bg-black hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 text-white shadow-lg transition-all hover:scale-105 rounded-xl font-medium disabled:opacity-50 disabled:hover:scale-100"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Add
                        </Button>
                        <Button
                            onClick={fetchAiSuggestions}
                            disabled={loadingSuggestions || !decision?.query || editingId !== null}
                            size="lg"
                            className="h-14 px-6 bg-gradient-to-r from-gray-800 to-black hover:from-black hover:to-gray-900 dark:from-gray-200 dark:to-white dark:hover:from-white dark:hover:to-gray-200 dark:text-black text-white shadow-lg transition-all hover:scale-105 rounded-xl font-medium border border-gray-700 dark:border-gray-300 disabled:opacity-50 disabled:hover:scale-100"
                        >
                            <Sparkles className="w-5 h-5 mr-2 text-yellow-400 dark:text-indigo-600" />
                            {loadingSuggestions ? "Thinking..." : "Smart Suggestions"}
                        </Button>
                    </div>

                    {aiSuggestions.length > 0 && (
                        <div className="mb-8 p-5 bg-gray-50 dark:bg-gray-900/50 border-2 border-gray-200 dark:border-gray-800 rounded-xl animate-fade-up relative z-10 shadow-inner">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-gray-900 dark:text-gray-200 font-bold flex items-center gap-2 uppercase tracking-wider text-sm">
                                    <Sparkles className="w-4 h-4 text-indigo-500" /> Suggested Options
                                </h3>
                                <Button
                                    onClick={fetchAiSuggestions}
                                    disabled={loadingSuggestions}
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30"
                                >
                                    {loadingSuggestions ? "Thinking..." : "Refresh"}
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {aiSuggestions.map((suggestion, idx) => (
                                    <div key={idx} className="flex items-center gap-2 bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 pl-4 pr-2 py-2 rounded-full shadow-sm hover:border-gray-900 dark:hover:border-gray-400 transition-colors group relative">
                                        <button
                                            onClick={() => fetchSummary(suggestion)}
                                            disabled={loadingSummaryFor === suggestion}
                                            className="text-sm font-semibold text-gray-800 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline decoration-2 underline-offset-2 transition-colors disabled:opacity-50 disabled:hover:no-underline"
                                            title={`View AI summary for ${suggestion}`}
                                        >
                                            {loadingSummaryFor === suggestion ? "Thinking..." : suggestion}
                                        </button>
                                        <div className="w-px h-4 bg-gray-200 dark:bg-gray-800 mx-1"></div>
                                        <button
                                            onClick={() => addAiOption(suggestion)}
                                            disabled={loading}
                                            className="text-gray-400 hover:text-black dark:text-gray-500 dark:hover:text-white p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                                            title="Add option"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="rounded-xl border-2 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 overflow-hidden relative z-10">
                        <ResizableTableContainer>
                            <Table aria-label="Added Options">
                                <TableHeader className="bg-gray-100 dark:bg-gray-900 border-b-2 border-gray-200 dark:border-gray-800">
                                    <Column isRowHeader className="w-16 font-bold text-gray-700 dark:text-gray-300 uppercase text-xs tracking-wider">No.</Column>
                                    <Column className="font-bold text-gray-700 dark:text-gray-300 uppercase text-xs tracking-wider">Option Name</Column>
                                    <Column className="w-[200px] font-bold text-gray-700 dark:text-gray-300 uppercase text-xs tracking-wider">Actions</Column>
                                </TableHeader>
                                <TableBody>
                                    {options.length === 0 ? (
                                        <Row>
                                            <Cell className="p-12 text-center text-gray-500 font-medium col-span-3">
                                                No options added yet. Type an option or use AI suggestions above to start!
                                            </Cell>
                                            <Cell>{""}</Cell>
                                            <Cell>{""}</Cell>
                                        </Row>
                                    ) : (
                                        options.map((opt, idx) => {
                                            const option = { ...opt, _isEditing: editingId === opt.id };
                                            const isEditing = option._isEditing;
                                            return (
                                                <Row key={option.id} className="group hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors border-b border-gray-200 dark:border-gray-800 last:border-0">
                                                    <Cell className="font-bold text-gray-400 dark:text-gray-500 pl-4 w-16 text-center">
                                                        {options.findIndex(o => o.id === option.id) + 1}
                                                    </Cell>
                                                    <Cell className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                                                        {isEditing ? (
                                                            <Input
                                                                value={option.title}
                                                                onChange={(e) => updateOptionLocal(option.id, e.target.value)}
                                                                className="h-10 max-w-sm border-gray-300 focus:border-gray-900 ring-0 focus:ring-gray-900"
                                                                autoFocus
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        saveOption(option.id);
                                                                    }
                                                                }}
                                                            />
                                                        ) : (
                                                            option.title
                                                        )}
                                                    </Cell>
                                                    <Cell className="w-[200px]">
                                                        <div className="flex justify-start gap-2">
                                                            {isEditing ? (
                                                                <Button size="sm" onClick={(e) => { e.stopPropagation(); saveOption(option.id) }} className="h-9 bg-black hover:bg-gray-800 text-white font-medium rounded-lg">
                                                                    Save
                                                                </Button>
                                                            ) : (
                                                                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setEditingId(option.id) }} className="h-9 text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                                                                    <Edit2 className="h-4 w-4 mr-1.5" /> Edit
                                                                </Button>
                                                            )}
                                                            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); removeOption(option.id) }} className="h-9 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors">
                                                                <Trash2 className="h-4 w-4 mr-1.5" /> Delete
                                                            </Button>
                                                        </div>
                                                    </Cell>
                                                </Row>
                                            )
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </ResizableTableContainer>
                    </div>

                    <div className="mt-8 flex justify-end">
                        <Button
                            size="lg"
                            onClick={() => navigate(`/decision/${decisionId}/criteria`)}
                            disabled={options.length < 2}
                            className="h-14 px-8 text-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 shadow-xl transition-all hover:scale-105"
                        >
                            Next Step
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* AI Summary Modal */}
            {summaryData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 relative">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-indigo-500" />
                                    {summaryData.option}
                                </h3>
                                <button
                                    onClick={() => setSummaryData(null)}
                                    className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="prose prose-sm dark:prose-invert prose-indigo max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                                <div className="space-y-4">
                                    <div className="bg-indigo-50 dark:bg-indigo-950/30 p-3 rounded-lg border border-indigo-100 dark:border-indigo-900/50">
                                        <h4 className="font-semibold text-indigo-900 dark:text-indigo-300 mb-1 text-sm uppercase tracking-wider">Estimated Price</h4>
                                        <p className="text-gray-900 dark:text-white font-bold text-lg m-0">{summaryData.data.price}</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                                            <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-1 text-sm m-0">Variants</h4>
                                            <p className="text-gray-600 dark:text-gray-400 text-sm leading-snug m-0">{summaryData.data.variants}</p>
                                        </div>
                                        <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg border border-green-100 dark:border-green-900/30">
                                            <h4 className="font-semibold text-green-800 dark:text-green-400 mb-1 text-sm m-0">Offers</h4>
                                            <p className="text-green-700 dark:text-green-500 text-sm leading-snug m-0">{summaryData.data.offers}</p>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2 pb-1 border-b border-gray-100 dark:border-gray-800 mt-0">Key Features</h4>
                                        <ul className="space-y-1 pl-0 list-none m-0">
                                            {Array.isArray(summaryData.data.features) && summaryData.data.features.map((feature, i) => (
                                                <li key={i} className="flex gap-2 text-sm text-gray-700 dark:text-gray-300 items-start m-0">
                                                    <span className="text-indigo-500 mt-0.5">•</span>
                                                    <span className="leading-snug">{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div>
                                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2 pb-1 border-b border-gray-100 dark:border-gray-800 mt-4">Pros & Cons</h4>
                                        <ul className="space-y-1 pl-0 list-none m-0">
                                            {Array.isArray(summaryData.data.pros_cons) && summaryData.data.pros_cons.map((pc, i) => (
                                                <li key={i} className="flex gap-2 text-sm text-gray-700 dark:text-gray-300 items-start m-0">
                                                    <span className="text-indigo-500 mt-0.5">•</span>
                                                    <span className="leading-snug">{pc}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-8 flex gap-3 justify-end border-t border-gray-100 dark:border-gray-800 pt-6">
                                <Button
                                    onClick={() => setSummaryData(null)}
                                    variant="outline"
                                    className="font-semibold text-gray-600 dark:text-gray-300 border-2"
                                >
                                    Close
                                </Button>
                                <Button
                                    onClick={() => {
                                        addAiOption(summaryData.option)
                                        setSummaryData(null)
                                    }}
                                    disabled={loading}
                                    className="font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-transform hover:scale-105"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add this Option
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    )
}
