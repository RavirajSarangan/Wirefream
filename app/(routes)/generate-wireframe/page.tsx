"use client"
import React, { useState, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useAuthContext } from '@/app/provider';
import axios from 'axios';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';

const COMPONENTS = [
    'Header', 'Navigation', 'Hero Section', 'Footer', 
    'Sidebar', 'Form', 'Card Grid', 'Search Bar',
    'Login Form', 'Signup Form', 'Dashboard', 'Profile Section'
];

function GenerateWireframe() {
    const { user } = useAuthContext();
    const [prompt, setPrompt] = useState('');
    const [style, setStyle] = useState('minimalist');
    const [deviceType, setDeviceType] = useState('mobile');
    const [selectedComponents, setSelectedComponents] = useState<string[]>([]);
    const [selectedModel, setSelectedModel] = useState('google/gemini-2.0-flash-001');
    const [loading, setLoading] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [generatedUid, setGeneratedUid] = useState<string | null>(null);
    const [wireframeData, setWireframeData] = useState<any>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const handleComponentToggle = (component: string) => {
        setSelectedComponents(prev =>
            prev.includes(component)
                ? prev.filter(c => c !== component)
                : [...prev, component]
        );
    };

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            toast.error('Please enter a UI description');
            return;
        }

        if (selectedComponents.length === 0) {
            toast.error('Please select at least one component');
            return;
        }

        setLoading(true);
        setGeneratedImage(null);

        try {
            const response = await axios.post('/api/generate-wireframe', {
                prompt,
                style,
                deviceType,
                components: selectedComponents,
                model: selectedModel,
                email: user?.email
            });

            if (response.data.success) {
                setWireframeData(response.data.wireframeData);
                setGeneratedUid(response.data.uid);
                // Canvas will render via useEffect
                toast.success('Wireframe generated successfully! (1 credit used)');
            } else {
                toast.error('Failed to generate wireframe');
            }
        } catch (error: any) {
            console.error('Generation error:', error);
            toast.error(error.response?.data?.error || 'Failed to generate wireframe');
        } finally {
            setLoading(false);
        }
    };

    // Render wireframe on canvas when data is available
    useEffect(() => {
        if (wireframeData && canvasRef.current) {
            console.log('Rendering wireframe with data:', wireframeData);
            renderWireframe(wireframeData, style, deviceType);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [wireframeData]);

    const renderWireframe = (data: any, styleType: string, device: string) => {
        console.log('renderWireframe called with device:', device, 'style:', styleType);
        const canvas = canvasRef.current;
        if (!canvas) {
            console.error('Canvas ref is null');
            return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('Failed to get 2d context');
            return;
        }

        console.log('Canvas rendering started...');

        // Set canvas size based on device type
        if (device === 'mobile') {
            canvas.width = 450;
            canvas.height = 900;
        } else if (device === 'tablet') {
            canvas.width = 800;
            canvas.height = 1100;
        } else {
            canvas.width = 1400;
            canvas.height = 900;
        }

        // Clear canvas
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Style configuration
        let lineWidth, fontSize, headingSize, detailLevel;
        if (styleType === 'minimalist') {
            lineWidth = 1;
            fontSize = 11;
            headingSize = 16;
            detailLevel = 'low';
            ctx.strokeStyle = '#CCCCCC';
        } else if (styleType === 'detailed') {
            lineWidth = 2.5;
            fontSize = 13;
            headingSize = 20;
            detailLevel = 'high';
            ctx.strokeStyle = '#333333';
        } else {
            lineWidth = 1.8;
            fontSize = 12;
            headingSize = 18;
            detailLevel = 'medium';
            ctx.strokeStyle = '#666666';
        }

        ctx.lineWidth = lineWidth;
        ctx.font = `${fontSize}px Arial`;
        ctx.fillStyle = '#666666';

        // Helper functions
        const drawImagePlaceholder = (x: number, y: number, w: number, h: number, label?: string) => {
            // Draw container
            ctx.strokeRect(x, y, w, h);
            
            // Draw X pattern for image
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + w, y + h);
            ctx.moveTo(x + w, y);
            ctx.lineTo(x, y + h);
            ctx.stroke();
            
            // Draw image icon
            const iconSize = Math.min(w, h) * 0.3;
            const iconX = x + (w - iconSize) / 2;
            const iconY = y + (h - iconSize) / 2;
            
            // Mountain/landscape icon
            ctx.beginPath();
            ctx.moveTo(iconX, iconY + iconSize);
            ctx.lineTo(iconX + iconSize * 0.4, iconY + iconSize * 0.4);
            ctx.lineTo(iconX + iconSize * 0.6, iconY + iconSize * 0.6);
            ctx.lineTo(iconX + iconSize, iconY + iconSize);
            ctx.stroke();
            
            // Sun/circle
            ctx.beginPath();
            ctx.arc(iconX + iconSize * 0.7, iconY + iconSize * 0.3, iconSize * 0.15, 0, Math.PI * 2);
            ctx.stroke();
            
            if (label) {
                ctx.fillStyle = '#999999';
                ctx.font = `${fontSize - 2}px Arial`;
                const textWidth = ctx.measureText(label).width;
                ctx.fillText(label, x + (w - textWidth) / 2, y + h - 10);
                ctx.font = `${fontSize}px Arial`;
                ctx.fillStyle = '#666666';
            }
        };

        const drawTextLines = (x: number, y: number, count: number, width: number, lineHeight = 20, actualText?: string[]) => {
            const textLineHeight = detailLevel === 'high' ? 3 : 2;
            ctx.fillStyle = '#CCCCCC';
            
            if (actualText && actualText.length > 0) {
                ctx.fillStyle = '#666666';
                ctx.font = `${fontSize}px Arial`;
                for (let i = 0; i < Math.min(count, actualText.length); i++) {
                    ctx.fillText(actualText[i], x, y + (i * lineHeight) + fontSize);
                }
            } else {
                for (let i = 0; i < count; i++) {
                    const lineY = y + (i * lineHeight);
                    const lineW = i === count - 1 ? width * 0.7 : width;
                    ctx.fillRect(x, lineY, lineW, textLineHeight);
                }
            }
            ctx.fillStyle = '#666666';
        };

        const drawButton = (x: number, y: number, w: number, h: number, label: string) => {
            // Draw button background
            ctx.fillStyle = '#F0F0F0';
            ctx.fillRect(x, y, w, h);
            ctx.fillStyle = '#666666';
            
            // Draw button border
            ctx.strokeRect(x, y, w, h);
            
            // Draw button text
            const prevFont = ctx.font;
            ctx.font = `bold ${fontSize + 2}px Arial`;
            ctx.fillStyle = '#333333';
            const textWidth = ctx.measureText(label).width;
            ctx.fillText(label, x + (w - textWidth) / 2, y + h / 2 + 5);
            ctx.font = prevFont;
            ctx.fillStyle = '#666666';
        };

        const drawIcon = (x: number, y: number, size: number, type: string) => {
            ctx.save();
            ctx.lineWidth = 2;
            
            if (type === 'menu') {
                // Hamburger menu
                for (let i = 0; i < 3; i++) {
                    ctx.fillRect(x, y + (i * (size / 3)), size, 2);
                }
            } else if (type === 'search') {
                // Search icon
                ctx.beginPath();
                ctx.arc(x + size * 0.4, y + size * 0.4, size * 0.3, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(x + size * 0.6, y + size * 0.6);
                ctx.lineTo(x + size * 0.9, y + size * 0.9);
                ctx.stroke();
            } else if (type === 'user') {
                // User icon
                ctx.beginPath();
                ctx.arc(x + size / 2, y + size * 0.3, size * 0.2, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(x + size / 2, y + size * 0.7, size * 0.35, 0, Math.PI);
                ctx.stroke();
            } else if (type === 'star') {
                // Star icon
                ctx.beginPath();
                for (let i = 0; i < 5; i++) {
                    const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
                    const x1 = x + size / 2 + (size / 2) * Math.cos(angle);
                    const y1 = y + size / 2 + (size / 2) * Math.sin(angle);
                    if (i === 0) ctx.moveTo(x1, y1);
                    else ctx.lineTo(x1, y1);
                }
                ctx.closePath();
                ctx.stroke();
            }
            
            ctx.restore();
        };

        // Render sections with proper layout
        let currentY = 30;
        const padding = 40;
        
        if (data.sections && Array.isArray(data.sections)) {
            for (const section of data.sections) {
                if (section.type === 'navigation' || section.type === 'header') {
                    const navHeight = section.height || 70;
                    
                    // Navigation background
                    ctx.fillStyle = '#FAFAFA';
                    ctx.fillRect(padding, currentY, canvas.width - (padding * 2), navHeight);
                    ctx.fillStyle = '#666666';
                    ctx.strokeRect(padding, currentY, canvas.width - (padding * 2), navHeight);
                    
                    // Logo area
                    if (section.hasLogo !== false) {
                        ctx.fillStyle = '#E8E8E8';
                        ctx.fillRect(padding + 20, currentY + 15, 120, 40);
                        ctx.fillStyle = '#666666';
                        ctx.strokeRect(padding + 20, currentY + 15, 120, 40);
                        
                        const prevFont = ctx.font;
                        ctx.font = `bold ${headingSize}px Arial`;
                        ctx.fillStyle = '#333333';
                        ctx.fillText('LOGO', padding + 50, currentY + 42);
                        ctx.font = prevFont;
                        ctx.fillStyle = '#666666';
                    }
                    
                    // Menu items
                    const menuItems = section.menuItems || ['Home', 'About', 'Services', 'Contact'];
                    const menuStartX = padding + 180;
                    const menuItemWidth = 100;
                    
                    ctx.font = `${fontSize + 1}px Arial`;
                    for (let i = 0; i < (Array.isArray(menuItems) ? menuItems.length : menuItems); i++) {
                        const x = menuStartX + (i * (menuItemWidth + 20));
                        const menuText = Array.isArray(menuItems) ? menuItems[i] : `Menu ${i + 1}`;
                        ctx.fillStyle = '#333333';
                        ctx.fillText(menuText, x, currentY + 40);
                    }
                    ctx.fillStyle = '#666666';
                    
                    // Right side icons
                    const iconY = currentY + navHeight / 2 - 12;
                    drawIcon(canvas.width - padding - 120, iconY, 24, 'search');
                    drawIcon(canvas.width - padding - 80, iconY, 24, 'user');
                    drawIcon(canvas.width - padding - 40, iconY, 24, 'menu');
                    
                    currentY += navHeight + 40;
                }
                
                else if (section.type === 'hero') {
                    const heroHeight = section.height || 400;
                    
                    if (section.layout === 'split') {
                        const leftW = (canvas.width - padding * 2 - 40) / 2;
                        const rightW = leftW;
                        const leftX = padding;
                        const rightX = padding + leftW + 40;
                        
                        // Text side
                        let textY = currentY + 80;
                        
                        // Greeting/Eyebrow text
                        if (section.hasGreeting !== false) {
                            ctx.font = `${fontSize}px Arial`;
                            ctx.fillStyle = '#888888';
                            ctx.fillText('👋 Welcome', leftX + 30, textY + fontSize);
                            ctx.fillStyle = '#666666';
                            textY += 40;
                        }
                        
                        // Main heading
                        if (section.hasHeading !== false) {
                            const prevFont = ctx.font;
                            ctx.font = `bold ${headingSize * 1.8}px Arial`;
                            ctx.fillStyle = '#222222';
                            
                            const headingText = section.headingText || 'Build Amazing';
                            ctx.fillText(headingText, leftX + 30, textY + headingSize * 1.8);
                            ctx.fillText('Products Faster', leftX + 30, textY + headingSize * 3.2);
                            
                            ctx.font = prevFont;
                            ctx.fillStyle = '#666666';
                            textY += headingSize * 4;
                        }
                        
                        // Subtitle/Description
                        if (section.hasSubtitle !== false) {
                            ctx.font = `${fontSize + 2}px Arial`;
                            ctx.fillStyle = '#555555';
                            const subtitleLines = [
                                'Create beautiful user interfaces with our',
                                'powerful design tools and templates.'
                            ];
                            drawTextLines(leftX + 30, textY, subtitleLines.length, leftW - 60, 24, subtitleLines);
                            textY += 70;
                        }
                        
                        // CTA Buttons
                        if (section.hasButton !== false) {
                            drawButton(leftX + 30, textY, 160, 50, section.buttonText || 'Get Started');
                            
                            // Secondary button
                            ctx.strokeRect(leftX + 210, textY, 140, 50);
                            ctx.fillStyle = '#666666';
                            ctx.font = `${fontSize + 1}px Arial`;
                            ctx.fillText('Learn More', leftX + 230, textY + 32);
                        }
                        
                        // Image side
                        drawImagePlaceholder(rightX, currentY + 40, rightW, heroHeight - 80, '[Hero Visual]');
                    } else {
                        // Full-width hero
                        drawImagePlaceholder(padding, currentY, canvas.width - (padding * 2), heroHeight, '[Background]');
                        
                        // Centered overlay content
                        const overlayX = canvas.width / 2 - 300;
                        const overlayY = currentY + heroHeight / 2 - 100;
                        
                        // Semi-transparent overlay box
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
                        ctx.fillRect(overlayX - 40, overlayY - 40, 680, 200);
                        ctx.fillStyle = '#666666';
                        ctx.strokeRect(overlayX - 40, overlayY - 40, 680, 200);
                        
                        // Heading
                        ctx.font = `bold ${headingSize * 2}px Arial`;
                        ctx.fillStyle = '#222222';
                        ctx.fillText('Your Awesome Headline', overlayX, overlayY + headingSize * 2);
                        
                        // Subheading
                        ctx.font = `${fontSize + 3}px Arial`;
                        ctx.fillStyle = '#555555';
                        ctx.fillText('Detailed description about your product or service', overlayX, overlayY + 80);
                        
                        // Button
                        drawButton(overlayX + 200, overlayY + 110, 180, 50, 'Get Started');
                    }
                    
                    currentY += heroHeight + 40;
                }
                
                else if (section.type === 'gallery' || section.type === 'cards') {
                    const count = section.count || section.imageCount || 6;
                    const cols = section.columns || 3;
                    const rows = Math.ceil(count / cols);
                    const gap = 25;
                    const itemW = (canvas.width - (padding * 2) - (gap * (cols - 1))) / cols;
                    const itemH = section.type === 'gallery' ? 240 : 320;
                    
                    // Section header
                    const sectionTitle = section.title || (section.type === 'gallery' ? 'Gallery' : 'Features');
                    ctx.font = `bold ${headingSize * 1.5}px Arial`;
                    ctx.fillStyle = '#222222';
                    ctx.fillText(sectionTitle, padding + 20, currentY + headingSize * 1.5);
                    
                    ctx.font = `${fontSize + 1}px Arial`;
                    ctx.fillStyle = '#666666';
                    ctx.fillText('Explore our amazing collection', padding + 20, currentY + headingSize * 1.5 + 30);
                    
                    currentY += 90;
                    
                    // Grid items
                    for (let i = 0; i < count; i++) {
                        const row = Math.floor(i / cols);
                        const col = i % cols;
                        const x = padding + (col * (itemW + gap));
                        const y = currentY + (row * (itemH + gap));
                        
                        // Card background
                        ctx.fillStyle = '#FAFAFA';
                        ctx.fillRect(x, y, itemW, itemH);
                        ctx.fillStyle = '#666666';
                        ctx.strokeRect(x, y, itemW, itemH);
                        
                        // Image area
                        if (section.hasImages !== false || section.type === 'gallery') {
                            drawImagePlaceholder(x + 12, y + 12, itemW - 24, itemH * 0.55, `Image ${i + 1}`);
                        }
                        
                        // Text content
                        if (section.type === 'cards') {
                            const textStartY = y + itemH * 0.62;
                            
                            // Title
                            ctx.font = `bold ${fontSize + 2}px Arial`;
                            ctx.fillStyle = '#333333';
                            ctx.fillText(`Card Title ${i + 1}`, x + 20, textStartY);
                            
                            // Description
                            ctx.font = `${fontSize}px Arial`;
                            ctx.fillStyle = '#666666';
                            const descLines = [
                                'This is a description of',
                                'the card content and features',
                                'that are being offered.'
                            ];
                            drawTextLines(x + 20, textStartY + 20, 3, itemW - 40, 18, descLines);
                            
                            // Rating stars
                            if (detailLevel !== 'low') {
                                for (let s = 0; s < 5; s++) {
                                    drawIcon(x + 20 + (s * 20), textStartY + 80, 16, 'star');
                                }
                            }
                        } else {
                            // Gallery caption
                            ctx.font = `${fontSize}px Arial`;
                            ctx.fillStyle = '#555555';
                            ctx.fillText(`Photo ${i + 1}`, x + 20, y + itemH * 0.7);
                        }
                    }
                    
                    currentY += (rows * (itemH + gap)) + 50;
                }
                
                else if (section.type === 'form') {
                    const formWidth = Math.min(650, canvas.width - (padding * 2));
                    const formX = (canvas.width - formWidth) / 2;
                    const fields = section.fields || ['Full Name', 'Email Address', 'Phone Number', 'Message'];
                    const formHeight = 120 + (fields.length * 85) + 100;
                    
                    // Form container
                    ctx.fillStyle = '#F8F8F8';
                    ctx.fillRect(formX, currentY, formWidth, formHeight);
                    ctx.fillStyle = '#666666';
                    ctx.strokeRect(formX, currentY, formWidth, formHeight);
                    
                    // Form title
                    ctx.fillStyle = '#222222';
                    ctx.font = `bold ${headingSize * 1.5}px Arial`;
                    const formTitle = section.title || 'Contact Us';
                    ctx.fillText(formTitle, formX + 40, currentY + 50);
                    
                    // Form subtitle
                    ctx.font = `${fontSize + 1}px Arial`;
                    ctx.fillStyle = '#666666';
                    ctx.fillText('Fill out the form below and we\'ll get back to you soon.', formX + 40, currentY + 80);
                    
                    // Form fields
                    let fieldY = currentY + 120;
                    for (let f = 0; f < fields.length; f++) {
                        const field = fields[f];
                        const isTextarea = field.toLowerCase().includes('message') || field.toLowerCase().includes('comment');
                        const fieldHeight = isTextarea ? 80 : 45;
                        
                        // Label
                        ctx.font = `bold ${fontSize}px Arial`;
                        ctx.fillStyle = '#444444';
                        ctx.fillText(field + ' *', formX + 40, fieldY);
                        
                        // Input field
                        ctx.fillStyle = '#FFFFFF';
                        ctx.fillRect(formX + 40, fieldY + 8, formWidth - 80, fieldHeight);
                        ctx.fillStyle = '#666666';
                        ctx.strokeRect(formX + 40, fieldY + 8, formWidth - 80, fieldHeight);
                        
                        // Placeholder text
                        ctx.font = `${fontSize}px Arial`;
                        ctx.fillStyle = '#AAAAAA';
                        const placeholder = isTextarea ? 'Enter your message here...' : `Enter your ${field.toLowerCase()}`;
                        ctx.fillText(placeholder, formX + 55, fieldY + 32);
                        ctx.fillStyle = '#666666';
                        
                        fieldY += fieldHeight + 37;
                    }
                    
                    // Checkbox
                    ctx.strokeRect(formX + 40, fieldY + 5, 18, 18);
                    ctx.font = `${fontSize - 1}px Arial`;
                    ctx.fillStyle = '#555555';
                    ctx.fillText('I agree to the terms and conditions', formX + 68, fieldY + 18);
                    
                    // Submit button
                    drawButton(formX + 40, fieldY + 45, 200, 50, section.buttonText || 'Submit Form');
                    
                    // Cancel/Reset link
                    ctx.font = `${fontSize}px Arial`;
                    ctx.fillStyle = '#888888';
                    ctx.fillText('or Cancel', formX + 260, fieldY + 70);
                    
                    currentY += formHeight + 50;
                }
                
                else if (section.type === 'footer') {
                    const footerHeight = section.height || 280;
                    const cols = section.columns || 4;
                    const colWidth = (canvas.width - (padding * 2)) / cols;
                    
                    // Footer background
                    ctx.fillStyle = '#2A2A2A';
                    ctx.fillRect(padding, currentY, canvas.width - (padding * 2), footerHeight);
                    ctx.fillStyle = '#666666';
                    ctx.strokeRect(padding, currentY, canvas.width - (padding * 2), footerHeight);
                    
                    // Footer columns
                    const columnTitles = ['Company', 'Products', 'Resources', 'Connect'];
                    const columnLinks = [
                        ['About Us', 'Careers', 'Press', 'Contact'],
                        ['Features', 'Pricing', 'Updates', 'Beta'],
                        ['Blog', 'Docs', 'Support', 'Community'],
                        ['Twitter', 'LinkedIn', 'GitHub', 'Email']
                    ];
                    
                    for (let i = 0; i < cols; i++) {
                        const x = padding + 30 + (i * colWidth);
                        
                        // Column heading
                        ctx.fillStyle = '#FFFFFF';
                        ctx.font = `bold ${fontSize + 3}px Arial`;
                        ctx.fillText(columnTitles[i] || `Column ${i + 1}`, x, currentY + 45);
                        
                        // Column links
                        ctx.font = `${fontSize}px Arial`;
                        ctx.fillStyle = '#AAAAAA';
                        
                        const links = columnLinks[i] || ['Link 1', 'Link 2', 'Link 3', 'Link 4'];
                        for (let j = 0; j < links.length; j++) {
                            ctx.fillText(links[j], x, currentY + 80 + (j * 26));
                        }
                    }
                    
                    // Divider line
                    ctx.strokeStyle = '#555555';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(padding + 30, currentY + footerHeight - 80);
                    ctx.lineTo(canvas.width - padding - 30, currentY + footerHeight - 80);
                    ctx.stroke();
                    ctx.strokeStyle = ctx.lineWidth === 2.5 ? '#333333' : ctx.lineWidth === 1.8 ? '#666666' : '#CCCCCC';
                    ctx.lineWidth = lineWidth;
                    
                    // Bottom section
                    ctx.font = `${fontSize - 1}px Arial`;
                    ctx.fillStyle = '#888888';
                    
                    // Copyright
                    ctx.fillText('© 2025 Company Name. All rights reserved.', padding + 30, currentY + footerHeight - 40);
                    
                    // Legal links
                    const legalLinks = ['Privacy Policy', 'Terms of Service', 'Cookie Policy'];
                    let legalX = canvas.width - padding - 30;
                    for (let i = legalLinks.length - 1; i >= 0; i--) {
                        const linkWidth = ctx.measureText(legalLinks[i]).width;
                        ctx.fillText(legalLinks[i], legalX - linkWidth, currentY + footerHeight - 40);
                        legalX -= linkWidth + 30;
                    }
                    
                    ctx.fillStyle = '#666666';
                    currentY += footerHeight + 20;
                }
            }
        }

        // Convert to image
        const dataUrl = canvas.toDataURL('image/png');
        console.log('Canvas rendered, dataUrl length:', dataUrl.length);
        setGeneratedImage(dataUrl);
        console.log('setGeneratedImage called');
    };

    const handleUseWireframe = () => {
        if (generatedImage && generatedUid) {
            // Navigate to dashboard and pass the generated wireframe
            window.location.href = `/dashboard?wireframeUrl=${encodeURIComponent(generatedImage)}`;
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Hidden canvas for wireframe generation */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            
            <div className="mb-6">
                <h1 className="text-3xl font-bold">Generate Wireframe</h1>
                <p className="text-gray-600 mt-2">
                    Describe your UI and let AI generate a professional wireframe (Costs 1 credit)
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Input Section */}
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            UI Description *
                        </label>
                        <Textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Describe the UI you want to create... e.g., 'A modern e-commerce product page with image gallery, product details, add to cart button, and related products section'"
                            className="min-h-[120px]"
                            disabled={loading}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Style
                            </label>
                            <Select value={style} onValueChange={setStyle} disabled={loading}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="minimalist">Minimalist</SelectItem>
                                    <SelectItem value="detailed">Detailed</SelectItem>
                                    <SelectItem value="colorful">Colorful</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Device Type
                            </label>
                            <Select value={deviceType} onValueChange={setDeviceType} disabled={loading}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="mobile">Mobile</SelectItem>
                                    <SelectItem value="tablet">Tablet</SelectItem>
                                    <SelectItem value="desktop">Desktop</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
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
                            Components to Include *
                        </label>
                        <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto border rounded-md p-3">
                            {COMPONENTS.map((component) => (
                                <label
                                    key={component}
                                    className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedComponents.includes(component)}
                                        onChange={() => handleComponentToggle(component)}
                                        disabled={loading}
                                        className="rounded"
                                    />
                                    <span className="text-sm">{component}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <Button
                        onClick={handleGenerate}
                        disabled={loading}
                        className="w-full"
                        size="lg"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating Wireframe...
                            </>
                        ) : (
                            'Generate Wireframe (1 Credit)'
                        )}
                    </Button>
                </div>

                {/* Preview Section */}
                <div className="border-2 border-dashed rounded-lg p-6 flex items-center justify-center min-h-[500px]">
                    {loading ? (
                        <div className="text-center">
                            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
                            <p className="text-gray-600">Generating your wireframe...</p>
                            <p className="text-sm text-gray-500 mt-2">This may take 30-60 seconds</p>
                        </div>
                    ) : generatedImage ? (
                        <div className="space-y-4 w-full">
                            <div className="relative w-full h-[500px]">
                                <Image
                                    src={generatedImage}
                                    alt="Generated Wireframe"
                                    fill
                                    className="object-contain rounded-lg"
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    onClick={handleUseWireframe}
                                    className="flex-1"
                                    size="lg"
                                >
                                    Use This Wireframe →
                                </Button>
                                <Button
                                    onClick={() => window.open(generatedImage, '_blank')}
                                    variant="outline"
                                    size="lg"
                                >
                                    Download
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-gray-400">
                            <p>Your generated wireframe will appear here</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default GenerateWireframe;
