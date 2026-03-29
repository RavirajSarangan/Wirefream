"use client"
import AppHeader from '@/app/_components/AppHeader'
import Constants from '@/data/Constants'
import axios from 'axios'
import { Loader2, Download } from 'lucide-react'
import { useParams } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import SelectionDetail from '../_components/SelectionDetail'
import CodeEditor from '../_components/CodeEditor'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

export interface RECORD {
    id: number,
    description: string,
    code: any,
    imageUrl: string,
    model: string,
    createdBy: string,
    uid: string
}

function ViewCode() {

    const { uid } = useParams();
    const [loading, setLoading] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [codeResp, setCodeResp] = useState('');
    const [record, setRecord] = useState<RECORD | null>();
    const [isReady, setIsReady] = useState(false);
    useEffect(() => {
        if (typeof globalThis.window !== "undefined") {
            uid && GetRecordInfo();

        }
    }, [uid])

    const GetRecordInfo = async (regen = false) => {
        console.log("RUN...")
        setIsReady(false);
        setCodeResp('');
        setLoading(true)

        const result = await axios.get('/api/wireframe-to-code?uid=' + uid)

        const resp = result?.data;
        setRecord(result?.data)

        if (resp?.code === null || regen) {
            GenerateCode(resp);
        }
        else {
            setCodeResp(resp?.code?.resp);
            setLoading(false);
            setIsReady(true);
        }
        if (resp?.error) {
            console.log("No Record Found")
        }
    }

    const GenerateCode = async (record: RECORD) => {
        setLoading(true)
        const res = await fetch('/api/ai-model', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                description: record?.description + ":" + Constants.PROMPT,
                model: record.model,
                imageUrl: record?.imageUrl
            })
        });

        if (!res.body) return;
        setLoading(false);
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const text = (decoder.decode(value)).replace('```jsx', '').replace('```javascript', '').replace('javascript', '').replace('jsx', '').replace('```', '');
            setCodeResp((prev) => prev + text);
            console.log(text);

        }

        setIsReady(true);
        UpdateCodeToDb();
    }

    useEffect(() => {
        if (codeResp !== '' && record?.uid && isReady && record?.code === null) {
            UpdateCodeToDb();
        }
    }, [codeResp && record && isReady])


    const UpdateCodeToDb = async () => {
        console.log(record)
        const result = await axios.put('/api/wireframe-to-code', {
            uid: record?.uid,
            codeResp: { resp: codeResp }
        });

        console.log(result);
    }

    const downloadZIP = async () => {
        if (!codeResp || !record) {
            toast.error('No code available to export')
            return
        }

        setDownloading(true)
        try {
            const response = await axios.post('/api/export-code', {
                code: codeResp,
                description: record.description,
                fileName: `wireframe-${record.uid}`
            }, {
                responseType: 'blob'
            })

            const url = globalThis.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `wireframe-${record.uid}.zip`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            globalThis.URL.revokeObjectURL(url)

            toast.success('Code exported successfully!')
        } catch (error) {
            console.error('Export error:', error)
            toast.error('Failed to export code')
        } finally {
            setDownloading(false)
        }
    }



    return (
        <div>
            <AppHeader hideSidebar={true} />
            <div className='grid grid-cols-1 md:grid-cols-5 p-5 gap-10'>
                <div>
                    {/* Selection Details  */}
                    <SelectionDetail record={record} regenrateCode={() => { GetRecordInfo(true) }}
                        isReady={isReady}
                    />
                </div>
                <div className='col-span-4'>
                    {/* Download Button */}
                    {isReady && !loading && (
                        <div className='mb-4 flex justify-end'>
                            <Button onClick={downloadZIP} disabled={downloading} variant='default'>
                                <Download className='mr-2 h-4 w-4' />
                                {downloading ? 'Exporting...' : 'Download ZIP'}
                            </Button>
                        </div>
                    )}
                    {/* Code Editor  */}
                    {loading ? <div>
                        <h2 className='font-bold text-2xl text-center p-20 flex items-center justify-center
                        bg-slate-100 h-[80vh] rounded-xl
                        '> <Loader2 className='animate-spin' /> Anaylzing the Wireframe...</h2>
                    </div> :
                        <CodeEditor codeResp={codeResp} isReady={isReady}
                        />
                    }
                </div>
            </div>




        </div>
    )
}

export default ViewCode