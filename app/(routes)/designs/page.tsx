"use client"
import { useAuthContext } from '@/app/provider'

// SEO: Private page - metadata in server component wrapper
import axios from 'axios';
import React, { useEffect, useState, useMemo, useRef } from 'react'
import DesignCard from './_components/DesignCard';
import { RECORD } from '@/app/view-code/[uid]/page';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Constants from '@/data/Constants';
import { Search } from 'lucide-react';

function Designs() {

    const { user } = useAuthContext();
    const [wireframeList, setWireframeList] = useState([]);
    const [searchInput, setSearchInput] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedModel, setSelectedModel] = useState<string>('all');
    const [sortBy, setSortBy] = useState<string>('newest');
    const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

    useEffect(() => {
        user && GetAllUserWireframe();
    }, [user])

    const GetAllUserWireframe = async () => {
        const result = await axios.get('/api/wireframe-to-code?email=' + user?.email);
        setWireframeList(result.data);
    }

    const handleDelete = (uid: string) => {
        // Remove deleted item from the list without refetching
        setWireframeList(prev => prev.filter((item: any) => item.uid !== uid));
    }

    const handleSearch = (val: string) => {
        setSearchInput(val)
        clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => setSearchTerm(val), 300)
    }

    // Filter and sort designs
    const filteredDesigns = useMemo(() => {
        let filtered = [...wireframeList];

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter((item: RECORD) =>
                item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.model?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Model filter
        if (selectedModel && selectedModel !== 'all') {
            filtered = filtered.filter((item: RECORD) =>
                item.model === selectedModel
            );
        }

        // Sort
        filtered.sort((a: any, b: any) => {
            if (sortBy === 'newest') {
                return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
            } else if (sortBy === 'oldest') {
                return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
            }
            return 0;
        });

        return filtered;
    }, [wireframeList, searchTerm, selectedModel, sortBy]);

    return (
        <div>
            <h2 className='font-bold text-2xl mb-6'>Wireframe & Codes</h2>

            {/* Filters Section */}
            <div className='mb-6 grid grid-cols-1 md:grid-cols-3 gap-4'>
                {/* Search */}
                <div className='relative'>
                    <Search className='absolute left-3 top-3 h-4 w-4 text-gray-400' />
                    <Input
                        type='text'
                        placeholder='Search designs...'
                        value={searchInput}
                        onChange={(e) => handleSearch(e.target.value)}
                        className='pl-10'
                    />
                </div>

                {/* Model Filter */}
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger>
                        <SelectValue placeholder='Filter by model' />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value='all'>All Models</SelectItem>
                        {Constants.AiModelList.map((model) => (
                            <SelectItem key={model.name} value={model.name}>
                                {model.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Sort */}
                <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                        <SelectValue placeholder='Sort by' />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value='newest'>Newest First</SelectItem>
                        <SelectItem value='oldest'>Oldest First</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Results Count */}
            {wireframeList.length > 0 && (
                <p className='text-sm text-gray-500 mb-4'>
                    Showing {filteredDesigns.length} of {wireframeList.length} designs
                </p>
            )}

            {wireframeList?.length === 0 && (
                <div className='mt-10 text-center text-gray-400'>
                    <p>No designs yet. Create your first wireframe!</p>
                </div>
            )}

            {wireframeList?.length > 0 && filteredDesigns.length === 0 && (
                <div className='mt-10 text-center text-gray-400'>
                    <p>No designs match your filters</p>
                </div>
            )}

            {wireframeList?.length > 0 && filteredDesigns.length > 0 && (
                <div className='grid grid-cols-2 lg:grid-cols-3 gap-7 mt-10'>
                    {filteredDesigns?.map((item: RECORD) => (
                        <DesignCard key={item.uid} item={item} onDelete={handleDelete} />
                    ))}
                </div>
            )}
        </div>
    )
}

export default Designs
