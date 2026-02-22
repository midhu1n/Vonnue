"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    Cell,
    Column,
    TableHeader,
    ResizableTableContainer,
} from "@/components/ui/table"
import { Row } from "react-aria-components" // Import Row from react-aria-components
import { Trash2, Edit2, Sparkles } from "lucide-react"

interface Criterion {
    id: string
    name: string
    weight: number
    type: "benefit" | "cost"
}

export default function CriteriaPage() {
    const params = useParams()
    const router = useRouter()
    const decisionId = params.id as string

    const [criteria, setCriteria] = useState<Criterion[]>([])

    const [editingId, setEditingId] = useState<string | null>(null)
    const [isDetecting, setIsDetecting] = useState(false)

    const addNewEmptyRow = () => {
        const tempId = crypto.randomUUID()
        setCriteria([...criteria, { id: tempId, name: "", weight: 0, type: "benefit" }])
        setEditingId(tempId)
    }

    const autoDetectTypeForId = async (id: string, currentName: string) => {
        if (!currentName.trim()) return

        setIsDetecting(true)
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/ai/guess-type/`, {
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
        if (!item?.name.trim()) {
            alert("Name is required.")
            return
        }
        if (item.weight <= 0 || item.weight > 1) {
            alert("Weight must be between 0.0 and 1.0.")
            return
        }
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
        if (confirm("Are you sure you want to remove this criterion?")) {
            setCriteria(criteria.filter(c => c.id !== id))
            if (editingId === id) setEditingId(null)
        }
    }

    const totalWeight = criteria.reduce((sum, c) => sum + (Number(c.weight) || 0), 0)
    const isExactlyOne = Math.abs(totalWeight - 1.0) < 0.001 // Floating point safety

    const handleNextStep = async () => {
        if (!isExactlyOne || editingId) return

        try {
            // Typically, one might save all in bulk or loop. Simple loop for MVP:
            for (const c of criteria) {
                await fetch(`http://127.0.0.1:8000/decisions/${decisionId}/criteria/`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        decision: decisionId,
                        name: c.name,
                        weight: c.weight,
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
        <div className="container mx-auto p-8 max-w-4xl">
            <h1 className="text-2xl font-bold mb-2">The Criteria &amp; Weights</h1>
            <p className="text-gray-500 mb-8">You decide what matters most to you. Weights must sum to <strong className="text-black">1.0 (100%)</strong>.</p>

            <div className="border rounded-lg mb-4 overflow-hidden bg-white shadow-sm">
                <ResizableTableContainer>
                    <Table aria-label="Criteria List">
                        <TableHeader>
                            <Column isRowHeader>Criterion Name</Column>
                            <Column>Weight (0-1)</Column>
                            <Column>Type</Column>
                            <Column className="text-right">Actions</Column>
                        </TableHeader>
                        <TableBody
                            items={criteria.map(c => ({ ...c, _isEditing: editingId === c.id, _isDetecting: isDetecting }))}
                            renderEmptyState={() => (
                                <div className="p-8 text-center text-gray-500">
                                    No criteria added yet. Click &quot;Add New Criterion&quot; below.
                                </div>
                            )}
                        >
                            {(item: Criterion & { _isEditing: boolean, _isDetecting: boolean }) => {
                                const isEditing = item._isEditing
                                const isDetecting = item._isDetecting
                                return (
                                    <Row key={item.id} className="group hover:bg-gray-50/50 transition-colors">
                                        <Cell>
                                            {isEditing ? (
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        value={item.name}
                                                        onChange={(e) => updateCriterion(item.id, "name", e.target.value)}
                                                        placeholder="e.g. Price"
                                                        className="h-8"
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
                                                <span className="font-medium">{item.name}</span>
                                            )}
                                        </Cell>
                                        <Cell>
                                            {isEditing ? (
                                                <Input
                                                    type="number"
                                                    step="0.1"
                                                    min="0"
                                                    max="1"
                                                    value={item.weight || ""}
                                                    onChange={(e) => updateCriterion(item.id, "weight", parseFloat(e.target.value) || 0)}
                                                    className="h-8 w-24"
                                                />
                                            ) : (
                                                <span>{item.weight} ({Math.round(item.weight * 100)}%)</span>
                                            )}
                                        </Cell>
                                        <Cell>
                                            {isEditing ? (
                                                <select
                                                    value={item.type}
                                                    onChange={(e) => updateCriterion(item.id, "type", e.target.value as "benefit" | "cost")}
                                                    className="h-8 border rounded px-2 w-full text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                                >
                                                    <option value="benefit">Benefit (High/Better)</option>
                                                    <option value="cost">Cost (Low/Better)</option>
                                                </select>
                                            ) : (
                                                <span>{item.type === "benefit" ? "Benefit (Higher is better)" : "Cost (Lower is better)"}</span>
                                            )}
                                        </Cell>
                                        <Cell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                {isEditing ? (
                                                    <Button size="sm" onClick={(e) => { e.stopPropagation(); saveRow(item.id) }} className="h-8 bg-indigo-600 hover:bg-indigo-700">
                                                        Save
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

            <div className="mb-8">
                <Button onClick={addNewEmptyRow} variant="outline" className="w-full border-dashed" disabled={!!editingId}>
                    + Add New Criterion
                </Button>
            </div>

            {/* Validation and Next Step */}
            <div className="flex flex-col items-end gap-2">
                <div className="text-lg">
                    Total Weight: <span className={isExactlyOne ? "text-green-600 font-bold" : "text-red-600 font-bold"}>{totalWeight.toFixed(2)}</span> / 1.00
                </div>
                {!isExactlyOne && criteria.length > 0 && (
                    <p className="text-red-500 text-sm font-medium">Weights must equal exactly 1.0 (Current: {totalWeight.toFixed(2)})</p>
                )}
                <Button
                    onClick={handleNextStep}
                    disabled={!isExactlyOne || criteria.length === 0}
                    className="w-full sm:w-auto"
                >
                    Save & Continue to Evaluation
                </Button>
            </div>
        </div>
    )
}
