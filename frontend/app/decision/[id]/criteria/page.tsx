"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { DotPattern } from "@/components/ui/dot-pattern"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    Cell,
    Column,
    Row,
    TableHeader,
    ResizableTableContainer,
} from "@/components/ui/table"
import { Trash2, Edit2, Sparkles, Check, ChevronDown, ChevronUp } from "lucide-react"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface Criterion {
    id: string
    name: string
    weight: number | string
    type: "benefit" | "cost"
}

export default function CriteriaPage() {
    const params = useParams()
    const router = useRouter()
    const decisionId = params.id as string

    const [criteria, setCriteria] = useState<Criterion[]>([])

    const [editingId, setEditingId] = useState<string | null>(null)
    const [isDetecting, setIsDetecting] = useState(false)
    const [showAddWarning, setShowAddWarning] = useState<"edit" | "empty" | null>(null)
    const [weightWarning, setWeightWarning] = useState<string | null>(null)

    const addNewEmptyRow = () => {
        if (editingId) {
            setShowAddWarning("edit")
            setTimeout(() => setShowAddWarning(null), 3000)
            return
        }
        if (criteria.some(c => !c.name.trim())) {
            setShowAddWarning("empty")
            setTimeout(() => setShowAddWarning(null), 3000)
            return
        }
        const currentTotal = criteria.reduce((sum, c) => sum + (Number(c.weight) || 0), 0)
        if (currentTotal >= 0.999) {
            setWeightWarning(currentTotal > 1.001 ? "Weight allocation exceeded" : "No more weight to allocate")
            setTimeout(() => setWeightWarning(null), 4000)
            return
        }

        const tempId = crypto.randomUUID()
        setCriteria([...criteria, { id: tempId, name: "", weight: "", type: "benefit" }])
        setEditingId(tempId)
        setShowAddWarning(null)
    }

    const autoDetectTypeForId = async (id: string, currentName: string) => {
        if (!currentName.trim()) return

        setIsDetecting(true)
        try {
            const res = await fetch(`/api/ai/guess-type/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ q: currentName })
            })
            if (res.ok) {
                const data = await res.json()
                if (data.analysis === "cost" || data.analysis === "benefit") {
                    updateCriterion(id, "type", data.analysis)
                }
            }
        } catch (err) {
            console.error("Failed to auto-detect", err)
        } finally {
            setIsDetecting(false)
        }
    }

    const updateCriterion = (id: string, field: keyof Criterion, value: string | number) => {
        setCriteria(criteria.map(c => c.id === id ? { ...c, [field]: value } : c))
    }

    const saveRow = (id: string) => {
        const item = criteria.find(c => c.id === id)


        const w = Number(item?.weight)
        if (isNaN(w) || w < 0 || w > 1 || item?.weight === "") {
            alert("Weight must be between 0.0 and 1.0.")
            return
        }

        // Check if saving this weight would push total over 1.0
        const otherWeights = criteria.reduce((sum, c) => c.id === id ? sum : sum + (Number(c.weight) || 0), 0)
        if (otherWeights + w > 1.001) {
            setWeightWarning("Weight allocation exceeded")
            setTimeout(() => setWeightWarning(null), 4000)
            return
        }

        updateCriterion(id, "weight", w)
        setEditingId(null)
    }

    // handleAddOrEdit is replaced by addNewEmptyRow and saveRow
    // const handleAddOrEdit = () => {
    //     if (!name || !weight) return

    //     const numWeight = parseFloat(weight)
    //     if (isNaN(numWeight) || numWeight <= 0 || numWeight > 1) {
    //         alert("Weight must be a number between 0.0 and 1.0")
    //         return
    //     }

    //     if (editingId) {
    //         setCriteria(criteria.map(c => c.id === editingId ? { ...c, name, weight: numWeight, type } : c))
    //         setEditingId(null)
    //     } else {
    //         setCriteria([...criteria, { id: crypto.randomUUID(), name, weight: numWeight, type }])
    //     }

    //     setName("")
    //     setWeight("")
    //     setType("benefit")
    // }

    // handleEdit is replaced by setEditingId directly in the UI
    // const handleEdit = (c: Criterion) => {
    //     setName(c.name)
    //     setWeight(c.weight.toString())
    //     setType(c.type)
    //     setEditingId(c.id)
    // }

    const handleRemove = (id: string) => {
        setCriteria(criteria.filter(c => c.id !== id))
        if (editingId === id) setEditingId(null)
    }

    const totalWeight = criteria.reduce((sum, c) => sum + (Number(c.weight) || 0), 0)
    const isExactlyOne = Math.abs(totalWeight - 1.0) < 0.001 // Floating point safety
    const hasEmptyAttribute = criteria.some(c => !c.name.trim())

    const handleNextStep = async () => {
        if (editingId) {
            setWeightWarning("Weight Limit Exceeded")
            setTimeout(() => setWeightWarning(null), 4000)
            return
        }
        if (totalWeight > 1.001) {
            setWeightWarning("Weight Limit Exceeded")
            setTimeout(() => setWeightWarning(null), 4000)
            return
        }
        if (!isExactlyOne) {
            setWeightWarning("Weight Limit Exceeded")
            setTimeout(() => setWeightWarning(null), 4000)
            return
        }
        setWeightWarning(null)

        try {
            // Typically, one might save all in bulk or loop. Simple loop for MVP:
            for (const c of criteria) {
                await fetch(`/api/decisions/${decisionId}/criteria/`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        decision: decisionId,
                        name: c.name,
                        weight: Number(c.weight),
                        type: c.type
                    })
                })
            }

            // Navigate to the next evaluation step (placeholder route)
            router.push(`/decision/${decisionId}/evaluate`)

        } catch (err) {
            console.error("Failed to save criteria", err)
            alert("Error saving criteria.")
        }
    }

    return (
        <section className="relative w-full min-h-[100vh] flex flex-col items-center justify-start px-4 md:px-8 py-16 overflow-hidden bg-gradient-to-br from-background to-muted/30">
            <DotPattern className={cn(
                "[mask-image:radial-gradient(50vw_circle_at_center,white,transparent)]",
            )} />
            <motion.div
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 0.4, scale: 1 }}
                transition={{ duration: 1.4 }}
                className="absolute top-[-100px] left-[-100px] w-[300px] h-[300px] bg-primary/30 blur-[120px] rounded-full z-0 pointer-events-none"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 0.3, scale: 1 }}
                transition={{ duration: 1.6, delay: 0.3 }}
                className="absolute bottom-[-100px] right-[-100px] w-[400px] h-[400px] bg-secondary/20 blur-[160px] rounded-full z-0 pointer-events-none"
            />
            <div className="absolute inset-0 z-0 pointer-events-none">
                {Array.from({ length: 30 }).map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 0 }}
                        animate={{ opacity: 0.2, y: [0, -20, 0] }}
                        transition={{
                            duration: 5 + Math.random() * 5,
                            repeat: Infinity,
                            delay: Math.random() * 5,
                        }}
                        className="absolute w-1 h-1 bg-muted-foreground/20 rounded-full"
                        style={{
                            top: `${Math.random() * 100}%`,
                            left: `${Math.random() * 100}%`,
                        }}
                    />
                ))}
            </div>

            <div className="relative z-10 w-full max-w-5xl">
                <div className="flex flex-col items-center justify-center mb-12 mt-8 text-center">
                    <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-4 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-200 dark:to-white">
                        What matters most?
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mt-2">
                        <strong className="text-xl text-indigo-600 dark:text-indigo-400 font-bold tracking-wide">Prioritize What Matters.</strong>
                        <span className="opacity-90 ml-2">Define your attributes and calibrate their impact.</span>
                    </p>
                </div>

                <div className="border-2 border-black dark:border-white rounded-xl mb-6 overflow-hidden bg-white/60 dark:bg-black/60 backdrop-blur-xl shadow-[8px_8px_0px_rgba(0,0,0,0.1)] dark:shadow-[8px_8px_0px_rgba(255,255,255,0.05)] ring-1 ring-black/5 dark:ring-white/5">
                    <ResizableTableContainer>
                        <Table aria-label="Criteria List">
                            <TableHeader className="bg-gray-100/90 dark:bg-gray-900/90 border-b-2 border-black dark:border-white [&_.flex-1]:justify-center">
                                <Column isRowHeader className="font-semibold w-10 text-center border-r border-gray-300 dark:border-gray-700">List</Column>
                                <Column isRowHeader className="font-semibold w-1/3 border-r border-gray-300 dark:border-gray-700">Attribute</Column>
                                <Column className="font-semibold border-r border-gray-300 dark:border-gray-700">Weight (0-1)</Column>
                                <Column className="font-semibold border-r border-gray-300 dark:border-gray-700">Type Focus</Column>
                                <Column className="text-center font-semibold">Actions</Column>
                            </TableHeader>
                            <TableBody
                                items={criteria.map((c, idx) => ({ ...c, _isEditing: editingId === c.id, _isDetecting: isDetecting, _rowIndex: idx + 1 }))}
                                renderEmptyState={() => (
                                    <div className="p-8 text-center text-gray-500">
                                        No attributes added yet. Click &quot;Add New Attribute&quot; below.
                                    </div>
                                )}
                            >
                                {(item: Criterion & { _isEditing: boolean, _isDetecting: boolean, _rowIndex: number }) => {
                                    const isEditing = item._isEditing
                                    const isDetecting = item._isDetecting
                                    return (
                                        <Row key={item.id} className="group hover:bg-gray-50/80 dark:hover:bg-gray-900/80 transition-colors border-b border-gray-300 dark:border-gray-700 last:border-b-0">
                                            <Cell className="border-r border-gray-300 dark:border-gray-700 text-center w-10 font-mono text-sm text-muted-foreground">{item._rowIndex}</Cell>
                                            <Cell className="border-r border-gray-300 dark:border-gray-700 text-center">
                                                {isEditing ? (
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Input
                                                            value={item.name}
                                                            onChange={(e) => updateCriterion(item.id, "name", e.target.value)}
                                                            placeholder="e.g. Price"
                                                            className="h-8 text-center"
                                                        />
                                                        <button
                                                            title="Auto-Detect Type"
                                                            type="button"
                                                            onClick={() => autoDetectTypeForId(item.id, item.name)}
                                                            disabled={isDetecting || !item.name}
                                                            className="text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                                                        >
                                                            <Sparkles className={`w-4 h-4 ${isDetecting ? 'animate-pulse' : ''}`} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    item.name.trim() !== "" ? (
                                                        <span className="font-medium">{item.name}</span>
                                                    ) : (
                                                        <span className="font-medium text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-md border border-red-200 dark:border-red-800 animate-pulse">
                                                            Fill the attribute
                                                        </span>
                                                    )
                                                )}
                                            </Cell>
                                            <Cell className="border-r border-gray-300 dark:border-gray-700 text-center">
                                                {isEditing ? (
                                                    <div className="flex items-center justify-center gap-3">
                                                        <Input
                                                            type="number"
                                                            step="0.05"
                                                            min="0"
                                                            max="1"
                                                            value={item.weight}
                                                            onChange={(e) => updateCriterion(item.id, "weight", e.target.value)}
                                                            className="h-8 w-20 text-center"
                                                        />
                                                    </div>
                                                ) : (
                                                    <span className="font-mono text-sm">{Number(item.weight).toFixed(2)} <span className="text-muted-foreground ml-1">({Math.round(Number(item.weight) * 100)}%)</span></span>
                                                )}
                                            </Cell>
                                            <Cell className="border-r border-gray-300 dark:border-gray-700 text-center">
                                                {isEditing ? (
                                                    <Select value={item.type} onValueChange={(val) => updateCriterion(item.id, "type", val as "cost" | "benefit")}>
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder="Select type..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectGroup>
                                                                <SelectItem value="benefit">Benefit (Higher is better)</SelectItem>
                                                                <SelectItem value="cost">Cost (Lower is better)</SelectItem>
                                                            </SelectGroup>
                                                        </SelectContent>
                                                    </Select>
                                                ) : (
                                                    <span className="font-medium text-gray-900 dark:text-gray-100">
                                                        {item.type === "benefit" ? "Benefit" : "Cost"}
                                                    </span>
                                                )}
                                            </Cell>
                                            <Cell className="text-center">
                                                <div className="flex justify-center gap-2">
                                                    {isEditing ? (
                                                        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); saveRow(item.id) }} className="h-8">
                                                            <Check className="h-4 w-4 mr-1" /> Save
                                                        </Button>
                                                    ) : (
                                                        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setEditingId(item.id) }} className="h-8">
                                                            <Edit2 className="h-4 w-4 mr-1" /> Edit
                                                        </Button>
                                                    )}
                                                    <Button variant="destructive" size="sm" onClick={(e) => { e.stopPropagation(); handleRemove(item.id) }} className="h-8">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </Cell>
                                        </Row>
                                    )
                                }}
                            </TableBody>
                        </Table>
                    </ResizableTableContainer>
                </div>

                <div className="mb-12 flex flex-col items-center gap-3">
                    <Button onClick={addNewEmptyRow} variant="outline" className="w-full border-dashed border-2 border-black dark:border-white py-8 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all rounded-xl relative">
                        <span className="flex items-center gap-2 text-base font-semibold">
                            <span className="text-xl leading-none">+</span> Add New Attribute
                        </span>
                    </Button>
                    <div className="h-10 w-full flex justify-center">
                        {weightWarning ? (
                            <motion.div
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/40 px-4 py-2 rounded-full border border-red-200 dark:border-red-800 shadow-sm animate-pulse"
                            >
                                ⚠ Warning: {weightWarning}
                            </motion.div>
                        ) : showAddWarning === "edit" ? (
                            <motion.div
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-sm font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/40 px-4 py-2 rounded-full border border-amber-200 dark:border-amber-800 shadow-sm"
                            >
                                Please save your current attribute before adding a new one.
                            </motion.div>
                        ) : showAddWarning === "empty" ? (
                            <motion.div
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/40 px-4 py-2 rounded-full border border-red-200 dark:border-red-800 shadow-sm animate-pulse"
                            >
                                Please fill in all missing attribute names before adding a new one.
                            </motion.div>
                        ) : null}
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-12">
                    {/* Left: Weight Allocation Box */}
                    <div className="w-full sm:w-1/2 min-h-[90px]">
                        <div className="flex flex-col justify-center gap-3 p-4 rounded-xl border-2 border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/20 backdrop-blur-sm h-full shadow-sm max-w-[400px]">
                            <h3 className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">Weight Allocation</h3>
                            <div className="flex flex-col gap-1.5">
                                <div className="flex justify-between w-full text-xs font-medium">
                                    <span className="text-gray-600 dark:text-gray-400">Total Allocated</span>
                                    <span className={cn(
                                        "font-mono font-bold",
                                        isExactlyOne ? "text-emerald-600 dark:text-emerald-400" : totalWeight > 1.00 ? "text-rose-600 dark:text-rose-400" : "text-indigo-600 dark:text-indigo-400"
                                    )}>
                                        {totalWeight.toFixed(2)} / 1.00
                                    </span>
                                </div>
                                <div className="h-2 w-full bg-gray-200 dark:bg-gray-700/50 rounded-full overflow-hidden flex shadow-inner">
                                    <div
                                        className={cn(
                                            "h-full transition-all duration-500",
                                            isExactlyOne ? "bg-emerald-500" : totalWeight > 1.00 ? "bg-rose-500" : "bg-indigo-500"
                                        )}
                                        style={{ width: `${Math.min(totalWeight * 100, 100)}%` }}
                                    />
                                </div>
                                {!isExactlyOne && (
                                    <div className="flex justify-start w-full text-[10px] font-semibold mt-0.5">
                                        {totalWeight < 1.00 ? (
                                            <span className="text-indigo-600 dark:text-indigo-400 animate-pulse">{(1.00 - totalWeight).toFixed(2)} remaining</span>
                                        ) : (
                                            <span className="text-rose-600 dark:text-rose-400 animate-pulse">{(totalWeight - 1.00).toFixed(2)} over limit</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>


                    {/* Right: Continue Button */}
                    <Button
                        onClick={handleNextStep}
                        disabled={criteria.length === 0 || hasEmptyAttribute}
                        className="bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 px-8 py-4 rounded-full text-base font-bold shadow-md hover:shadow-xl transition-all self-end sm:self-center uppercase tracking-wide"
                    >
                        Continue <span className="ml-2 text-xl font-normal">→</span>
                    </Button>
                </div>

                {/* Need Help Link */}
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
