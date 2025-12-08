"use client"
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle2, XCircle, FileSearch, RefreshCw, Brain, Link, ExternalLink, Globe, Download } from 'lucide-react'
import React, { useState } from 'react'
import axios from 'axios'
import { toast } from 'sonner'

interface PlagiarismReportProps {
    result: any
    originalText: string
    onCheckAnother: () => void
}

function PlagiarismReport({ result, originalText, onCheckAnother }: PlagiarismReportProps) {
    const [highlightedText, setHighlightedText] = useState<string>('')
    const [activeTab, setActiveTab] = useState<'overview' | 'sources' | 'ai-detection'>('overview')
    const [downloading, setDownloading] = useState(false)

    const downloadPDF = async () => {
        setDownloading(true)
        try {
            const response = await axios.post('/api/generate-plagiarism-report', result, {
                responseType: 'blob'
            })
            
            const url = globalThis.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `plagiarism-report-${result.uid || Date.now()}.pdf`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            globalThis.URL.revokeObjectURL(url)
            
            toast.success('PDF report downloaded successfully!')
        } catch (error) {
            console.error('Download error:', error)
            toast.error('Failed to download PDF report')
        } finally {
            setDownloading(false)
        }
    }

    const similarityScore = result.similarityScore || 0
    const aiDetectionScore = result.aiDetectionScore || 0
    const uniqueContent = result.uniqueContent || (100 - similarityScore)

    // Color palette for different sources (Turnitin-like)
    const sourceColors = [
        { bg: 'bg-blue-200', border: 'border-blue-400', text: 'text-blue-800' },
        { bg: 'bg-purple-200', border: 'border-purple-400', text: 'text-purple-800' },
        { bg: 'bg-pink-200', border: 'border-pink-400', text: 'text-pink-800' },
        { bg: 'bg-orange-200', border: 'border-orange-400', text: 'text-orange-800' },
        { bg: 'bg-teal-200', border: 'border-teal-400', text: 'text-teal-800' },
        { bg: 'bg-indigo-200', border: 'border-indigo-400', text: 'text-indigo-800' },
    ]

    const getScoreColor = (score: number) => {
        if (score <= 24) return 'text-green-600'
        if (score <= 49) return 'text-yellow-600'
        if (score <= 74) return 'text-orange-600'
        return 'text-red-600'
    }

    const getScoreBg = () => {
        if (similarityScore <= 15) return 'bg-green-50 border-green-200'
        if (similarityScore <= 40) return 'bg-yellow-50 border-yellow-200'
        return 'bg-red-50 border-red-200'
    }

    const getScoreIcon = () => {
        if (similarityScore <= 15) return <CheckCircle2 className='h-12 w-12 text-green-600' />
        if (similarityScore <= 40) return <AlertCircle className='h-12 w-12 text-yellow-600' />
        return <XCircle className='h-12 w-12 text-red-600' />
    }

    const getScoreLabel = () => {
        if (similarityScore <= 15) return 'Excellent - Original Content'
        if (similarityScore <= 40) return 'Moderate - Some Similarities Found'
        return 'High Risk - Significant Plagiarism Detected'
    }

    const getAIDetectionLabel = () => {
        if (aiDetectionScore <= 30) return 'Low - Likely Human Written'
        if (aiDetectionScore <= 70) return 'Medium - Possible AI Assistance'
        return 'High - Likely AI Generated'
    }

    const getAIDetectionColor = (score: number) => {
        if (score <= 30) return 'text-green-600'
        if (score <= 70) return 'text-yellow-600'
        return 'text-purple-600'
    }

    const getAIProgressBarColor = (score: number) => {
        if (score <= 30) return 'bg-green-500'
        if (score <= 70) return 'bg-yellow-500'
        return 'bg-purple-500'
    }

    // Get severity class for sections
    const getSeverityClass = (severity: string) => {
        if (severity === 'high') return 'bg-red-200'
        if (severity === 'medium') return 'bg-yellow-200'
        return 'bg-orange-100'
    }

    const getSeverityBorderClass = (severity: string) => {
        if (severity === 'high') return 'border-red-500 bg-red-50'
        if (severity === 'medium') return 'border-yellow-500 bg-yellow-50'
        return 'border-orange-500 bg-orange-50'
    }

    const getSeverityBadgeClass = (severity: string) => {
        if (severity === 'high') return 'bg-red-200 text-red-800'
        if (severity === 'medium') return 'bg-yellow-200 text-yellow-800'
        return 'bg-orange-200 text-orange-800'
    }

    // Enhanced highlighting with multi-color sources
    const highlightSuspiciousSections = () => {
        let highlighted = originalText
        const sections = result.suspiciousSections || []
        const sortedSections = [...sections].sort((a: any, b: any) => b.startIndex - a.startIndex)

        for (const section of sortedSections) {
            const severityClass = getSeverityClass(section.severity)
            let typeClass = ''
            if (section.type === 'ai-generated') {
                typeClass = 'bg-violet-200 border-l-4 border-violet-500'
            } else if (section.type === 'paraphrasing') {
                typeClass = 'bg-amber-100 border-l-4 border-amber-500'
            }
            
            const before = highlighted.substring(0, section.startIndex)
            const match = highlighted.substring(section.startIndex, section.endIndex)
            const after = highlighted.substring(section.endIndex)
            
            const className = section.type === 'ai-generated' || section.type === 'paraphrasing' ? typeClass : severityClass
            highlighted = before + `<mark class="${className} px-1" title="${section.reason} (${section.type || 'plagiarism'})">${match}</mark>` + after
        }

        return highlighted
    }

    React.useEffect(() => {
        setHighlightedText(highlightSuspiciousSections())
    }, [result, originalText])

    return (
        <div className='space-y-6'>
            {/* Overall Score Card */}
            <div className={`p-8 border-2 rounded-lg ${getScoreBg()}`}>
                <div className='flex items-center justify-between mb-6'>
                    <div className='flex items-center gap-4'>
                        {getScoreIcon()}
                        <div>
                            <h2 className='text-2xl font-bold'>Plagiarism Analysis Complete</h2>
                            <p className='text-gray-600'>{getScoreLabel()}</p>
                    </div>
                </div>
                <div className='flex gap-2'>
                    <Button onClick={downloadPDF} disabled={downloading} variant='default'>
                        <Download className='mr-2 h-4 w-4' />
                        {downloading ? 'Generating...' : 'Download PDF'}
                    </Button>
                    <Button onClick={onCheckAnother} variant='outline'>
                        <RefreshCw className='mr-2 h-4 w-4' />
                        Check Another
                    </Button>
                </div>
            </div>                <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mt-6'>
                    <div className='text-center p-4 bg-white rounded-lg border'>
                        <div className={`text-4xl font-bold ${getScoreColor(similarityScore)}`}>
                            {similarityScore}%
                        </div>
                        <div className='text-sm text-gray-600 mt-2'>Similarity Score</div>
                    </div>
                    <div className='text-center p-4 bg-white rounded-lg border'>
                        <div className={`text-4xl font-bold ${getAIDetectionColor(aiDetectionScore)}`}>
                            {aiDetectionScore}%
                        </div>
                        <div className='text-sm text-gray-600 mt-2'>AI Detection</div>
                    </div>
                    <div className='text-center p-4 bg-white rounded-lg border'>
                        <div className='text-4xl font-bold text-green-600'>
                            {uniqueContent}%
                        </div>
                        <div className='text-sm text-gray-600 mt-2'>Unique Content</div>
                    </div>
                    <div className='text-center p-4 bg-white rounded-lg border'>
                        <div className='text-4xl font-bold text-blue-600'>
                            {result.suspiciousSections?.length || 0}
                        </div>
                        <div className='text-sm text-gray-600 mt-2'>Flagged Sections</div>
                    </div>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className='border-b border-gray-200'>
                <nav className='flex gap-4'>
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`px-4 py-2 border-b-2 font-medium transition-colors ${
                            activeTab === 'overview' 
                                ? 'border-blue-600 text-blue-600' 
                                : 'border-transparent text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        <FileSearch className='inline mr-2 h-4 w-4' />
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('sources')}
                        className={`px-4 py-2 border-b-2 font-medium transition-colors ${
                            activeTab === 'sources' 
                                ? 'border-blue-600 text-blue-600' 
                                : 'border-transparent text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        <Globe className='inline mr-2 h-4 w-4' />
                        Sources ({result.sourceBreakdown?.length || result.matchedSources?.length || 0})
                    </button>
                    <button
                        onClick={() => setActiveTab('ai-detection')}
                        className={`px-4 py-2 border-b-2 font-medium transition-colors ${
                            activeTab === 'ai-detection' 
                                ? 'border-blue-600 text-blue-600' 
                                : 'border-transparent text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        <Brain className='inline mr-2 h-4 w-4' />
                        AI Detection
                    </button>
                </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
                <div className='space-y-6'>
                    {/* Overall Assessment */}
                    {result.overallAssessment && (
                        <div className='p-6 bg-blue-50 border border-blue-200 rounded-lg'>
                            <h3 className='font-semibold text-lg mb-2 flex items-center gap-2'>
                                <FileSearch className='h-5 w-5' />
                                Overall Assessment
                            </h3>
                            <p className='text-gray-700'>{result.overallAssessment}</p>
                        </div>
                    )}

                    {/* Paraphrasing Detection */}
                    {result.paraphrasingDetected && result.paraphrasingDetected !== 'no' && (
                        <div className='p-6 bg-amber-50 border border-amber-200 rounded-lg'>
                            <h3 className='font-semibold text-lg mb-2'>Paraphrasing Detected</h3>
                            <p className='text-gray-700'>
                                {result.paraphrasingDetected === 'yes' 
                                    ? 'Significant paraphrasing detected. Content appears to be reworded from other sources.'
                                    : 'Some sections show signs of paraphrasing. Review flagged sections carefully.'}
                            </p>
                        </div>
                    )}

                    {/* Suspicious Sections */}
                    {result.suspiciousSections && result.suspiciousSections.length > 0 && (
                        <div className='p-6 bg-white border rounded-lg shadow-sm'>
                            <h3 className='font-semibold text-lg mb-4'>Suspicious Sections ({result.suspiciousSections.length})</h3>
                            <div className='space-y-4'>
                                {result.suspiciousSections.map((section: any, index: number) => (
                                    <div 
                                        key={`section-${index}-${section.startIndex}`}
                                        className={`p-4 border-l-4 rounded ${getSeverityBorderClass(section.severity)}`}
                                    >
                                        <div className='flex items-start justify-between mb-2'>
                                            <div className='flex gap-2'>
                                                <span className={`text-xs font-semibold px-2 py-1 rounded ${getSeverityBadgeClass(section.severity)}`}>
                                                    {section.severity.toUpperCase()} RISK
                                                </span>
                                                {section.type && section.type !== 'plagiarism' && (
                                                    <span className='text-xs font-semibold px-2 py-1 rounded bg-gray-200 text-gray-800'>
                                                        {section.type.toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <p className='font-mono text-sm mb-2 italic'>&quot;{section.text}&quot;</p>
                                        <p className='text-sm text-gray-700'><strong>Reason:</strong> {section.reason}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Highlighted Text View */}
                    <div className='p-6 bg-white border rounded-lg shadow-sm'>
                        <div className='flex items-center justify-between mb-4'>
                            <h3 className='font-semibold text-lg'>Text Analysis with Highlights</h3>
                            <div className='flex flex-wrap gap-2 text-xs'>
                                <span className='px-2 py-1 bg-red-200 rounded'>High Risk</span>
                                <span className='px-2 py-1 bg-yellow-200 rounded'>Medium Risk</span>
                                <span className='px-2 py-1 bg-orange-100 rounded'>Low Risk</span>
                                <span className='px-2 py-1 bg-violet-200 border-l-4 border-violet-500 rounded'>AI Generated</span>
                                <span className='px-2 py-1 bg-amber-100 border-l-4 border-amber-500 rounded'>Paraphrasing</span>
                            </div>
                        </div>
                        <div 
                            className='p-4 bg-gray-50 rounded border font-mono text-sm whitespace-pre-wrap max-h-[600px] overflow-y-auto'
                            dangerouslySetInnerHTML={{ __html: highlightedText }}
                        />
                    </div>

                    {/* Recommendations */}
                    {result.recommendations && result.recommendations.length > 0 && (
                        <div className='p-6 bg-green-50 border border-green-200 rounded-lg'>
                            <h3 className='font-semibold text-lg mb-4'>Recommendations for Improvement</h3>
                            <ul className='space-y-2'>
                                {result.recommendations.map((rec: string, index: number) => (
                                    <li key={`rec-${rec.substring(0, 50)}-${index}`} className='flex items-start gap-2'>
                                        <CheckCircle2 className='h-5 w-5 text-green-600 mt-0.5 flex-shrink-0' />
                                        <span className='text-gray-700'>{rec}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'sources' && (
                <div className='space-y-6'>
                    {/* Source Breakdown Table (Turnitin-style) */}
                    {result.sourceBreakdown && result.sourceBreakdown.length > 0 ? (
                        <div className='p-6 bg-white border rounded-lg shadow-sm'>
                            <h3 className='font-semibold text-lg mb-4'>Detailed Source Analysis</h3>
                            <div className='overflow-x-auto'>
                                <table className='w-full'>
                                    <thead className='bg-gray-100'>
                                        <tr>
                                            <th className='px-4 py-3 text-left text-sm font-semibold'>Source</th>
                                            <th className='px-4 py-3 text-left text-sm font-semibold'>Type</th>
                                            <th className='px-4 py-3 text-center text-sm font-semibold'>Match %</th>
                                            <th className='px-4 py-3 text-center text-sm font-semibold'>Excerpts</th>
                                            <th className='px-4 py-3 text-center text-sm font-semibold'>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {result.sourceBreakdown.map((source: any, index: number) => {
                                            const colorScheme = sourceColors[index % sourceColors.length]
                                            return (
                                                <tr key={`source-${source.sourceUrl || source.sourceTitle || index}`} className='border-b hover:bg-gray-50'>
                                                    <td className='px-4 py-3'>
                                                        <div className='flex items-center gap-2'>
                                                            <div className={`w-3 h-3 rounded-full ${colorScheme.bg} ${colorScheme.border} border-2`}></div>
                                                            <div>
                                                                <div className='font-medium text-sm'>{source.sourceTitle || 'Unknown Source'}</div>
                                                                {source.sourceUrl && source.sourceUrl !== 'unknown' && (
                                                                    <div className='text-xs text-blue-600 truncate max-w-[300px]'>
                                                                        {source.sourceUrl}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className='px-4 py-3'>
                                                        <span className='text-xs px-2 py-1 bg-gray-100 rounded'>
                                                            {source.sourceType || 'unknown'}
                                                        </span>
                                                    </td>
                                                    <td className='px-4 py-3 text-center'>
                                                        <span className={`font-bold ${getScoreColor(source.matchPercentage || 0)}`}>
                                                            {source.matchPercentage || 0}%
                                                        </span>
                                                    </td>
                                                    <td className='px-4 py-3 text-center'>
                                                        <span className='text-sm text-gray-600'>
                                                            {source.excerpts?.length || 0}
                                                        </span>
                                                    </td>
                                                    <td className='px-4 py-3 text-center'>
                                                        {source.sourceUrl && source.sourceUrl !== 'unknown' && (
                                                            <a 
                                                                href={source.sourceUrl.startsWith('http') ? source.sourceUrl : `https://${source.sourceUrl}`}
                                                                target='_blank'
                                                                rel='noopener noreferrer'
                                                                className='text-blue-600 hover:text-blue-800'
                                                            >
                                                                <ExternalLink className='h-4 w-4 inline' />
                                                            </a>
                                                        )}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        /* Fallback to matched sources */
                        result.matchedSources && result.matchedSources.length > 0 && (
                            <div className='p-6 bg-white border rounded-lg shadow-sm'>
                                <h3 className='font-semibold text-lg mb-4'>Potential Sources</h3>
                                <div className='space-y-3'>
                                    {result.matchedSources.map((source: any, index: number) => {
                                        const colorScheme = sourceColors[index % sourceColors.length]
                                        return (
                                            <div key={`match-${source.source}-${index}`} className={`p-4 ${colorScheme.bg} border-l-4 ${colorScheme.border} rounded-lg`}>
                                                <div className='flex items-center justify-between mb-2'>
                                                    <div className='flex items-center gap-2'>
                                                        <Link className='h-5 w-5' />
                                                        <h4 className='font-semibold'>{source.source}</h4>
                                                    </div>
                                                    <div className='flex items-center gap-3'>
                                                        {source.matchPercentage && (
                                                            <span className='text-sm font-bold'>{source.matchPercentage}% match</span>
                                                        )}
                                                        <span className='text-sm text-gray-600'>{source.confidence}% confidence</span>
                                                    </div>
                                                </div>
                                                <p className='text-sm text-gray-700'>{source.description}</p>
                                                {source.type && (
                                                    <span className='inline-block mt-2 text-xs px-2 py-1 bg-white bg-opacity-50 rounded'>
                                                        Type: {source.type}
                                                    </span>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    )}

                    {/* Source Type Breakdown */}
                    {result.sourceBreakdown && result.sourceBreakdown.length > 0 && (
                        <div className='p-6 bg-white border rounded-lg shadow-sm'>
                            <h3 className='font-semibold text-lg mb-4'>Sources by Type</h3>
                            <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
                                {Object.entries(
                                    result.sourceBreakdown.reduce((acc: any, source: any) => {
                                        const type = source.sourceType || 'unknown'
                                        acc[type] = (acc[type] || 0) + 1
                                        return acc
                                    }, {})
                                ).map(([type, count]) => (
                                    <div key={type} className='p-4 bg-gray-50 border rounded text-center'>
                                        <div className='text-2xl font-bold text-gray-700'>{count as number}</div>
                                        <div className='text-sm text-gray-600 capitalize'>{type}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'ai-detection' && (
                <div className='space-y-6'>
                    {/* AI Detection Score */}
                    <div className='p-6 bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-lg'>
                        <div className='flex items-center gap-4 mb-4'>
                            <Brain className='h-10 w-10 text-purple-600' />
                            <div>
                                <h3 className='font-semibold text-xl'>AI Content Detection</h3>
                                <p className='text-gray-600'>{getAIDetectionLabel()}</p>
                            </div>
                        </div>
                        <div className='flex items-center gap-4'>
                            <div className='flex-1'>
                                <div className='h-8 bg-gray-200 rounded-full overflow-hidden'>
                                    <div 
                                        className={`h-full transition-all ${getAIProgressBarColor(aiDetectionScore)}`}
                                        style={{ width: `${aiDetectionScore}%` }}
                                    ></div>
                                </div>
                            </div>
                            <div className={`text-3xl font-bold ${getAIDetectionColor(aiDetectionScore)}`}>
                                {aiDetectionScore}%
                            </div>
                        </div>
                    </div>

                    {/* AI Detection Analysis */}
                    {result.aiDetectionAnalysis && (
                        <>
                            {/* Detected Patterns */}
                            {result.aiDetectionAnalysis.patterns && result.aiDetectionAnalysis.patterns.length > 0 && (
                                <div className='p-6 bg-white border rounded-lg shadow-sm'>
                                    <h3 className='font-semibold text-lg mb-4'>AI Writing Patterns Detected</h3>
                                    <ul className='space-y-2'>
                                        {result.aiDetectionAnalysis.patterns.map((pattern: string, index: number) => (
                                            <li key={`pattern-${pattern.substring(0, 50)}-${index}`} className='flex items-start gap-2'>
                                                <AlertCircle className='h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0' />
                                                <span className='text-gray-700'>{pattern}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* AI-Generated Sections */}
                            {result.aiDetectionAnalysis.sections && result.aiDetectionAnalysis.sections.length > 0 && (
                                <div className='p-6 bg-white border rounded-lg shadow-sm'>
                                    <h3 className='font-semibold text-lg mb-4'>
                                        Suspected AI-Generated Sections ({result.aiDetectionAnalysis.sections.length})
                                    </h3>
                                    <div className='space-y-4'>
                                        {result.aiDetectionAnalysis.sections.map((section: any, index: number) => (
                                            <div 
                                                key={`ai-section-${section.text.substring(0, 30)}-${index}`}
                                                className='p-4 border-l-4 border-violet-500 bg-violet-50 rounded'
                                            >
                                                <div className='flex items-center justify-between mb-2'>
                                                    <span className='text-xs font-semibold px-2 py-1 rounded bg-violet-200 text-violet-800'>
                                                        {section.confidence}% AI CONFIDENCE
                                                    </span>
                                                </div>
                                                <p className='font-mono text-sm italic'>&quot;{section.text}&quot;</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* AI Detection Info */}
                    <div className='p-6 bg-blue-50 border border-blue-200 rounded-lg'>
                        <h3 className='font-semibold text-lg mb-2'>About AI Detection</h3>
                        <p className='text-sm text-gray-700 mb-3'>
                            Our AI detection analyzes writing patterns, sentence structure, vocabulary usage, and other linguistic markers 
                            that are characteristic of AI-generated content from models like GPT, Claude, and Bard.
                        </p>
                        <p className='text-sm text-gray-600 italic'>
                            Note: AI detection is probabilistic and should be used as one factor in assessing content originality.
                        </p>
                    </div>
                </div>
            )}

            {/* Credits Info */}
            {result.creditsRemaining !== undefined && (
                <div className='text-center text-sm text-gray-600 pt-4 border-t'>
                    Credits remaining: <strong>{result.creditsRemaining}</strong>
                    {result.aiModelUsed && <span className='ml-4'>Model used: <strong>{result.aiModelUsed}</strong></span>}
                </div>
            )}
        </div>
    )
}

export default PlagiarismReport
