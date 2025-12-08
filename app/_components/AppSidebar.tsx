import React from 'react'
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
} from "@/components/ui/sidebar"
import { ArrowLeftRight, CircleDollarSign, FileSearch, FileType, Paintbrush, Sparkles, History, Workflow, Home, Minimize2 } from "lucide-react"
import Image from 'next/image'
import { usePathname } from 'next/navigation'

const items = [
    {
        title: "Workspace",
        url: "/dashboard",
        icon: Home,
    },
    {
        title: "Generate Wireframe",
        url: "/generate-wireframe",
        icon: Sparkles,
    },
    {
        title: "UI to Wireframe",
        url: "/ui-to-wireframe",
        icon: ArrowLeftRight,
    },
    {
        title: "Word to PDF",
        url: "/word-to-pdf",
        icon: FileType,
    },
    {
        title: "PDF to Word",
        url: "/pdf-to-word",
        icon: FileType,
    },
    {
        title: "PDF Compress",
        url: "/pdf-compress",
        icon: Minimize2,
    },
    {
        title: "Plagiarism Checker",
        url: "/plagiarism-checker",
        icon: FileSearch,
    },
    {
        title: "App Flow Generator",
        url: "/app-flow-generator",
        icon: Workflow,
    },
    {
        title: "History",
        url: "/history",
        icon: History,
    },
    {
        title: "Design",
        url: "/designs",
        icon: Paintbrush,
    },
    {
        title: "Credits",
        url: "/credits",
        icon: CircleDollarSign,
    },

]

export function AppSidebar() {
    const path = usePathname();
    console.log(path)
    return (
        <Sidebar>
            <SidebarHeader>
                <div className='p-4'>
                    <div className='flex items-center gap-2'>
                        <Image src={'/logo.svg'} alt='logo' width={100} height={100}
                            className='w-[40px] h-[40px]' />
                        <h2 className='font-bold text-lg'>Wireframe to Code</h2>
                    </div>
                    <h2 className='text-sm text-gray-400 text-center'>Build Awesome</h2>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>

                    <SidebarGroupContent>
                        <SidebarMenu className='mt-5'>
                            {items.map((item) => (
                                <a href={item.url} key={item.url}
                                    className={`p-2 text-lg flex gap-2 items-center
                                 hover:bg-gray-100 rounded-lg
                                 ${path == item.url && 'bg-gray-200'}
                                 `}>
                                    <item.icon className='h-5 w-5' />
                                    <span>{item.title}</span>
                                </a>

                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <h2 className='p-2 text-gray-400 text-sm'>Copyright @VenomXTechnology</h2>
            </SidebarFooter>
        </Sidebar>
    )
}
