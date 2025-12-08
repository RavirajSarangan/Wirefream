import React, { Suspense } from 'react'
import ImageUpload from './_components/ImageUpload'

function Dashboard() {
    return (
        <div className='xl:px-20'>
            <h2 className='font-bold text-3xl'>Convert Wireframe to Code</h2>
            <Suspense fallback={<div className="p-4">Loading...</div>}>
                <ImageUpload />
            </Suspense>
        </div>
    )
}

export default Dashboard