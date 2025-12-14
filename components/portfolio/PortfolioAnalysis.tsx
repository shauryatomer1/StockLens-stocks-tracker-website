"use client";

import { useState } from "react";
import { analyzePortfolio } from "@/actions/analyze-portfolio";
import { Loader2, Sparkles, RefreshCcw } from "lucide-react";

interface PortfolioAnalysisProps {
    userId: string;
}

export default function PortfolioAnalysis({ userId }: PortfolioAnalysisProps) {
    const [analysis, setAnalysis] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAnalyze = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await analyzePortfolio(userId);
            if (result.success && result.analysis) {
                setAnalysis(result.analysis);
            } else {
                setError(result.message || "Something went wrong");
            }
        } catch (err) {
            setError("Failed to connect to the server");
        } finally {
            setLoading(false);
        }
    };

    const getRiskColor = (level: string) => {
        switch (level?.toLowerCase()) {
            case "low": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
            case "medium": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
            case "high": return "bg-rose-500/10 text-rose-400 border-rose-500/20";
            default: return "bg-slate-500/10 text-slate-400 border-slate-500/20";
        }
    };

    return (
        <div className="w-full bg-slate-900/50 border border-slate-800 rounded-xl p-6 mt-6 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-xl font-semibold flex items-center gap-2 text-white mb-1">
                        <Sparkles className="w-5 h-5 text-indigo-400" />
                        AI Portfolio Analyst
                    </h2>
                    <p className="text-sm text-slate-400">Personalized insights powered by advanced AI</p>
                </div>
                <button
                    onClick={handleAnalyze}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-900/20"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> :
                        analysis ? <RefreshCcw className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />
                    }
                    {loading ? "Analyzing..." : analysis ? "Re-Analyze" : "Generate Insights"}
                </button>
            </div>

            {error && (
                <div className="p-4 bg-red-950/30 border border-red-900/50 rounded-lg text-red-400 text-sm mb-6">
                    {error}
                </div>
            )}

            {analysis && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Summary Section */}
                    <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-800/50">
                        <div className="flex items-start justify-between gap-4">
                            <p className="text-slate-300 leading-relaxed text-sm">
                                {analysis.summary}
                            </p>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${getRiskColor(analysis.riskLevel)}`}>
                                {analysis.riskLevel} Risk
                            </span>
                        </div>
                    </div>

                    {/* Grid Layout */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg bg-slate-800/20 border border-slate-800/50">
                            <h3 className="text-slate-200 font-medium mb-3 text-sm flex items-center gap-2">
                                <div className="w-1 h-1 rounded-full bg-blue-400" />
                                Composition Analysis
                            </h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                {analysis.composition}
                            </p>
                        </div>
                        <div className="p-4 rounded-lg bg-slate-800/20 border border-slate-800/50">
                            <h3 className="text-slate-200 font-medium mb-3 text-sm flex items-center gap-2">
                                <div className="w-1 h-1 rounded-full bg-purple-400" />
                                Diversification
                            </h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                {analysis.diversification}
                            </p>
                        </div>
                        <div className="p-4 rounded-lg bg-slate-800/20 border border-slate-800/50 md:col-span-2">
                            <h3 className="text-slate-200 font-medium mb-3 text-sm flex items-center gap-2">
                                <div className="w-1 h-1 rounded-full bg-orange-400" />
                                Risk Analysis
                            </h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                {analysis.riskAnalysis}
                            </p>
                        </div>
                    </div>

                    {/* Suggestions */}
                    <div className="pt-2">
                        <h3 className="text-slate-200 font-medium mb-4 text-sm">Strategic Suggestions</h3>
                        <div className="space-y-3">
                            {analysis.suggestions?.map((suggestion: string, i: number) => (
                                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-indigo-950/10 border border-indigo-500/10">
                                    <div className="mt-1 min-w-[16px]">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400/60" />
                                    </div>
                                    <span className="text-slate-300 text-sm">{suggestion}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {!analysis && !loading && !error && (
                <div className="text-center py-12 px-4 rounded-lg border border-dashed border-slate-800 bg-slate-900/20">
                    <div className="w-12 h-12 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Sparkles className="w-6 h-6 text-slate-500" />
                    </div>
                    <h3 className="text-slate-200 font-medium mb-2">Ready to Analyze</h3>
                    <p className="text-slate-400 text-sm max-w-sm mx-auto">
                        Get personalized AI insights on your portfolio composition, risk exposure, and diversification opportunities.
                    </p>
                </div>
            )}
        </div>
    );
}
