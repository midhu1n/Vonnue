import { CheckCircle2, List, Settings2, BarChart3, Target } from "lucide-react"

const steps = [
    {
        id: "step-1",
        title: "Define Options",
        description: "List the alternatives you are deciding between (e.g. Laptops, Cars, Job Offers).",
        icon: <List className="w-8 h-8 text-indigo-500 max-h-8" />
    },
    {
        id: "step-2",
        title: "Set Criteria",
        description: "Identify the factors that matter most for your decision (e.g. Price, Quality, Battery Life) and mark them as Benefits or Costs.",
        icon: <Settings2 className="w-8 h-8 text-cyan-500 max-h-8" />
    },
    {
        id: "step-3",
        title: "Assign Weights",
        description: "Distribute weights between 0 and 1 across your criteria to define which factors are strictly the most important to you.",
        icon: <BarChart3 className="w-8 h-8 text-orange-500 max-h-8" />
    },
    {
        id: "step-4",
        title: "Score Options",
        description: "Score each of your options on a scale of 1 to 10 for every individual criterion based on real-world data.",
        icon: <CheckCircle2 className="w-8 h-8 text-emerald-500 max-h-8" />
    },
    {
        id: "step-5",
        title: "Get The Best Decision",
        description: "Evalora evaluates your inputs using the WSM (Weighted Sum Model) equation to calculate the exact optimal choice.",
        icon: <Target className="w-8 h-8 text-rose-500 max-h-8" />
    }
]

export function HowItWorks() {
    return (
        <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto dark:bg-black w-full" id="how-it-works">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 text-gray-900 dark:text-gray-100">
                    How Evalora Works
                </h2>
                <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-lg">
                    A simple 5-step process to transform overwhelming choices into clear, mathematically backed decisions.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative">
                {/* Connecting Lines Context */}
                <div className="hidden lg:block absolute top-[45px] left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-indigo-500/20 via-orange-500/20 to-rose-500/20 -z-10" />
                <div className="hidden lg:block absolute top-[245px] left-[30%] right-[30%] h-0.5 bg-gradient-to-r from-emerald-500/20 to-rose-500/20 -z-10" />

                {steps.map((step, index) => (
                    <div
                        key={step.id}
                        className={`
                            relative flex flex-col p-8 rounded-3xl bg-white dark:bg-zinc-900/50 
                            border border-gray-100 dark:border-zinc-800 shadow-xl shadow-gray-200/50 dark:shadow-none
                            hover:bg-gray-50/50 dark:hover:bg-zinc-800/50 transition-colors
                            ${index === 3 ? "lg:col-start-1 lg:ml-auto lg:w-[calc(100%+2rem)]" : ""}
                            ${index === 4 ? "lg:col-start-2 lg:mx-auto lg:w-[calc(100%+2rem)]" : ""}
                        `}
                    >
                        <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 flex items-center justify-center font-bold shadow-lg border-4 border-white dark:border-black z-10">
                            {index + 1}
                        </div>

                        <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-zinc-800 flex items-center justify-center mb-6 shadow-inner border border-gray-100 dark:border-zinc-700">
                            {step.icon}
                        </div>

                        <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-gray-50">
                            {step.title}
                        </h3>

                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
                            {step.description}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    )
} 
