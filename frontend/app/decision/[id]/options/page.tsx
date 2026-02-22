"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowRight, Plus, Edit2, Trash2 } from "lucide-react"
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

export default function OptionsPage() {
    const params = useParams()
    const router = useRouter()
    const decisionId = params.id as string

    const [options, setOptions] = useState<Option[]>([])
    const [newOption, setNewOption] = useState("")
    const [loading, setLoading] = useState(false)
    const [decision, setDecision] = useState<Decision | null>(null)
    const [editingId, setEditingId] = useState<string | null>(null)

    useEffect(() => {
        const fetchDecision = async () => {
            try {
                const res = await fetch(`/api/decisions/${decisionId}/`)
                if (res.ok) {
                    const data = await res.json()
                    setDecision(data)
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
                <div className="text-center">
                    <h1 className="font-bold text-gray-900 dark:text-white text-balance text-3xl sm:text-4xl md:text-5xl leading-tight sm:leading-tight md:leading-tight lg:leading-tight mb-6">
                        <span className="block text-gray-400 dark:text-gray-500 text-lg md:text-xl mb-2 font-medium tracking-normal">Options for</span>
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                            {decision ? `"${decision.query}"` : "Define Your Options"}
                        </span>
                    </h1>
                    <p className="text-lg sm:text-xl text-gray-700 dark:text-gray-300 text-pretty max-w-2xl mx-auto leading-relaxed mb-10 px-4 font-medium">
                        List the possibilities you are considering. We&apos;ll help you evaluate them next.
                    </p>
                </div>

                <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl overflow-hidden p-6 md:p-8">
                    <div className="flex gap-4 mb-8">
                        <Input
                            placeholder={placeholder}
                            value={newOption}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewOption(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="flex-1 h-12 text-lg shadow-sm border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 text-center"
                            autoFocus
                        />
                        <Button
                            onClick={addOption}
                            disabled={loading || !newOption.trim()}
                            size="lg"
                            className="h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg transition-all hover:scale-105"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Add
                        </Button>
                    </div>

                    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm overflow-hidden">
                        <ResizableTableContainer>
                            <Table aria-label="Added Options">
                                <TableHeader className="bg-gray-50/50 dark:bg-gray-800/50">
                                    <Column isRowHeader className="w-16">#</Column>
                                    <Column>Option Name</Column>
                                    <Column className="w-[200px]">Actions</Column>
                                </TableHeader>
                                <TableBody
                                    items={options.map(opt => ({ ...opt, _isEditing: editingId === opt.id }))}
                                    renderEmptyState={() => (
                                        <div className="h-48 flex items-center justify-center text-center text-gray-500">
                                            No options added yet. Start adding above!
                                        </div>
                                    )}
                                >
                                    {(option: Option & { _isEditing: boolean }) => {
                                        const isEditing = option._isEditing
                                        return (
                                            <Row key={option.id} className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                                                <Cell className="font-medium text-gray-500 pl-4 w-16">
                                                    {options.findIndex(o => o.id === option.id) + 1}
                                                </Cell>
                                                <Cell className="font-semibold text-lg text-gray-800 dark:text-gray-200">
                                                    {isEditing ? (
                                                        <Input
                                                            value={option.title}
                                                            onChange={(e) => updateOptionLocal(option.id, e.target.value)}
                                                            className="h-8 max-w-sm"
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
                                                            <Button size="sm" onClick={(e) => { e.stopPropagation(); saveOption(option.id) }} className="h-8 bg-indigo-600 hover:bg-indigo-700 text-white">
                                                                Save
                                                            </Button>
                                                        ) : (
                                                            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setEditingId(option.id) }} className="h-8 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50">
                                                                <Edit2 className="h-4 w-4 mr-1" /> Edit
                                                            </Button>
                                                        )}
                                                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); removeOption(option.id) }} className="h-8 text-red-500 hover:text-red-700 hover:bg-red-50">
                                                            <Trash2 className="h-4 w-4 mr-1" /> Delete
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

                    <div className="mt-8 flex justify-end">
                        <Button
                            size="lg"
                            onClick={() => router.push(`/decision/${decisionId}/criteria`)}
                            disabled={options.length < 2}
                            className="h-14 px-8 text-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 shadow-xl transition-all hover:scale-105"
                        >
                            Next Step
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    </div>
                </div>
            </div>
        </main>
    )
}
