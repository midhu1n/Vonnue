"use client"

import React, { createContext, useContext, useState, ReactNode } from "react"
import { useRouter } from "next/navigation"
import { GlobalLoader } from "@/components/ui/global-loader"

type LoaderContextType = {
    startLoading: (duration?: number) => void
    navigate: (path: string, options?: { showLoader?: boolean }) => void
}

const LoaderContext = createContext<LoaderContextType | undefined>(undefined)

export const LoaderProvider = ({ children }: { children: ReactNode }) => {
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const startLoading = (duration = 4000) => {
        setIsLoading(true)
        setTimeout(() => {
            setIsLoading(false)
        }, duration)
    }

    const navigate = (path: string, options: { showLoader?: boolean } = { showLoader: true }) => {
        if (options.showLoader) {
            startLoading()
        }
        router.push(path)
    }

    return (
        <LoaderContext.Provider value={{ startLoading, navigate }}>
            {isLoading && <GlobalLoader />}
            {children}
        </LoaderContext.Provider>
    )
}

export const useLoader = () => {
    const context = useContext(LoaderContext)
    if (!context) throw new Error("useLoader must be used within a LoaderProvider")
    return context
}
