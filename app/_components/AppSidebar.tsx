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
import { CircleDollarSign, FileSearch, FileType, FileEdit, History, Workflow, Shield, GitGraph } from "lucide-react"
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const items = [
    {
        title: "PDF Tools",
        url: "/pdf-tools",
        icon: FileType,
    },
    {
        title: "Cover Page Creator",
        url: "/cover-page-creator",
        icon: FileEdit,
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
        title: "Diagram Generator",
        url: "/diagram-generator",
        icon: GitGraph,
    },
    {
        title: "History",
        url: "/history",
        icon: History,
    },
    {
        title: "Credits",
        url: "/credits",
        icon: CircleDollarSign,
    },
]

const securityItems = [
    {
        title: "Security Settings",
        url: "/settings",
        icon: Shield,
    },
]

export function AppSidebar() {
    const path = usePathname();
    return (
        <Sidebar>
            <SidebarHeader>
                <div className='p-4'>
                    <div className='flex items-center gap-2'>
                        <Image src={'/logo.svg'} alt='logo' width={40} height={40}
                            className='w-[40px] h-[40px]' />
                        <h2 className='font-bold text-lg'>Wireframe to Code</h2>
                    </div>
                    <h2 className='text-sm text-gray-400 text-center'>Build Awesome</h2>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu className='mt-3'>
                            {items.map((item) => (
                                <Link href={item.url} key={item.url}
                                    className={`p-2 text-lg flex gap-2 items-center text-gray-700
                                 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors
                                 ${path == item.url && 'bg-blue-100 text-blue-700 font-medium'}
                                 `}>
                                    <item.icon className='h-5 w-5' />
                                    <span>{item.title}</span>
                                </Link>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
                
                {/* Security Section */}
                <SidebarGroup>
                    <div className='px-4 py-2'>
                        <h3 className='text-xs font-semibold text-gray-500 uppercase tracking-wider'>Security</h3>
                    </div>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {securityItems.map((item) => (
                                <Link href={item.url} key={item.url}
                                    className={`p-2 text-lg flex gap-2 items-center text-gray-700
                                 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors
                                 ${path == item.url && 'bg-blue-100 text-blue-700 font-medium'}
                                 `}>
                                    <item.icon className='h-5 w-5' />
                                    <span>{item.title}</span>
                                </Link>
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
