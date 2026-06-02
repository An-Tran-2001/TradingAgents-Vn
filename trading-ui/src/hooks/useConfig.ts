"use client"

import { useState, useEffect } from "react"
import { configApi, ProviderInfo, ModelInfo } from "@/lib/api/config"

export function useProviders() {
  const [providers, setProviders] = useState<ProviderInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    configApi.getProviders()
      .then(setProviders)
      .catch(() => {/* silent — fallback to hardcoded */})
      .finally(() => setIsLoading(false))
  }, [])

  return { providers, isLoading }
}

export function useProviderModels(providerId: string | null) {
  const [models, setModels] = useState<ModelInfo[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!providerId) { setModels([]); return }
    setIsLoading(true)
    configApi.getProviderModels(providerId)
      .then((res) => setModels(res.models))
      .catch(() => setModels([]))
      .finally(() => setIsLoading(false))
  }, [providerId])

  return { models, isLoading }
}
