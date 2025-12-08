"use client"
import React, { useState, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useAuthContext } from '@/app/provider';
import axios from 'axios';
import Image from 'next/image';
import { CloudUpload, Loader2, X } from 'lucide-react';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '@/configs/firebaseConfig';

function UIToWireframe() {
    const { user } = useAuthContext();
    const [originalFile, setOriginalFile] = useState<File | null>(null);
    const [originalPreview, setOriginalPreview] = useState<string | null>(null);
    const [description, setDescription] = useState('');
    const [style, setStyle] = useState('standard');
    const [selectedModel, setSelectedModel] = useState('google/gemini-2.0-flash-001');
    const [loading, setLoading] = useState(false);
    const [wireframeData, setWireframeData] = useState<{ description: string; analysis: string } | null>(null);

    const handleImageSelect = (event: ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && files[0]) {
            const file = files[0];
            setOriginalFile(file);
            const previewUrl = URL.createObjectURL(file);
            setOriginalPreview(previewUrl);
            setWireframeData(null);
        }
    };

    const handleConvert = async () => {
        if (!originalFile) {
            toast.error('Please upload a UI design image');
            return;
        }

        setLoading(true);
        setWireframeData(null);

        try {
            const fileName = `ui-to-wireframe/${Date.now()}_${originalFile.name}`;
            const imageRef = ref(storage, fileName);
            await uploadBytes(imageRef, originalFile);
            const originalImageUrl = await getDownloadURL(imageRef);

            const response = await axios.post('/api/ui-to-wireframe', {
                originalImageUrl,
                style,
                model: selectedModel,
                description,
                email: user?.email
            });

            if (response.data.success) {
                setWireframeData({
                    description: response.data.wireframeDescription,
                    analysis: response.data.analysis
                });
                toast.success('Wireframe analysis generated successfully! (1 credit used)');
            } else {
                toast.error('Failed to generate wireframe');
            }
        } catch (error: any) {
            console.error('Conversion error:', error);
            toast.error(error.response?.data?.error || 'Failed to convert UI to wireframe');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setOriginalFile(null);
        setOriginalPreview(null);
        setWireframeData(null);
        setDescription('');
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">Convert UI to Wireframe</h1>
                <p className="text-gray-600 mt-2">
                    Upload a finished UI design and AI will analyze it and generate wireframe specifications (Costs 1 credit)
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div>
                    <label className="block text-sm font-medium mb-2">
                        Wireframe Style
                    </label>
                    <Select value={style} onValueChange={setStyle} disabled={loading}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="minimalist">Minimalist</SelectItem>
                            <SelectItem value="standard">Standard</SelectItem>
                            <SelectItem value="detailed">Detailed</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2">
                        AI Model
                    </label>
                    <Select value={selectedModel} onValueChange={setSelectedModel} disabled={loading}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="google/gemini-2.0-flash-001">
                                <div className="flex items-center gap-2">
                                    <Image src="/google.png" alt="Google" width={20} height={20} />
                                    <span>Gemini Google</span>
                                </div>
                            </SelectItem>
                            <SelectItem value="meta-llama/llama-3.2-90b-vision-instruct">
                                <div className="flex items-center gap-2">
                                    <Image src="/meta.png" alt="Meta" width={20} height={20} />
                                    <span>llama By Meta</span>
                                </div>
                            </SelectItem>
                            <SelectItem value="deepseek/deepseek-chat">
                                <div className="flex items-center gap-2">
                                    <Image src="/deepseek.png" alt="Deepseek" width={20} height={20} />
                                    <span>Deepkseek</span>
                                </div>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2">
                        Actions
                    </label>
                    <div className="flex gap-2">
                        <Button
                            onClick={handleConvert}
                            disabled={loading || !originalFile}
                            className="flex-1"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Converting...
                                </>
                            ) : (
                                'Convert (1 Credit)'
                            )}
                        </Button>
                        {(originalPreview || wireframeData) && (
                            <Button
                                onClick={handleReset}
                                variant="outline"
                                disabled={loading}
                            >
                                Reset
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            <div className="mb-6">
                <label className="block text-sm font-medium mb-2">
                    Optional Description
                </label>
                <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add any additional context about the UI design (optional)..."
                    className="min-h-[80px]"
                    disabled={loading}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <h2 className="font-semibold text-lg">Original UI Design</h2>
                    {!originalPreview ? (
                        <div className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center min-h-[400px] hover:bg-gray-50 transition">
                            <CloudUpload className="h-12 w-12 text-primary mb-4" />
                            <h3 className="font-bold text-lg mb-2">Upload UI Image</h3>
                            <p className="text-gray-500 mb-4 text-center">
                                Click button to select a finished UI design
                            </p>
                            <label htmlFor="imageSelect" className="cursor-pointer">
                                <div className="px-6 py-3 bg-blue-100 text-primary font-bold rounded-md hover:bg-blue-200 transition">
                                    Select Image
                                </div>
                            </label>
                            <input
                                type="file"
                                id="imageSelect"
                                className="hidden"
                                accept="image/*"
                                onChange={handleImageSelect}
                            />
                        </div>
                    ) : (
                        <div className="border-2 border-dashed rounded-lg p-4 relative">
                            <div className="relative w-full h-[400px]">
                                <Image
                                    src={originalPreview}
                                    alt="Original UI"
                                    fill
                                    className="object-contain rounded-lg"
                                />
                            </div>
                            {!loading && (
                                <button
                                    onClick={() => {
                                        setOriginalPreview(null);
                                        setOriginalFile(null);
                                        setWireframeData(null);
                                    }}
                                    className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <h2 className="font-semibold text-lg">Wireframe Specification</h2>
                    <div className="border-2 border-dashed rounded-lg p-4 min-h-[400px] max-h-[600px] overflow-y-auto">
                        {loading ? (
                            <div className="text-center flex flex-col items-center justify-center h-full">
                                <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
                                <p className="text-gray-600 font-medium">Analyzing UI and generating wireframe...</p>
                                <p className="text-sm text-gray-500 mt-2">This may take 30-60 seconds</p>
                            </div>
                        ) : wireframeData ? (
                            <div className="space-y-4">
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h3 className="font-semibold mb-2 text-sm text-gray-700">UI Analysis:</h3>
                                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{wireframeData.analysis}</p>
                                </div>
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <h3 className="font-semibold mb-2 text-sm text-gray-700">Wireframe Specification:</h3>
                                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{wireframeData.description}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-gray-400 flex items-center justify-center h-full">
                                <div>
                                    <p>Your wireframe specification will appear here</p>
                                    <p className="text-sm mt-2">Upload a UI design to get started</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default UIToWireframe;
