"use client"
import React, { useState, ChangeEvent, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useAuthContext } from '@/app/provider';
import axios from 'axios';
import Image from 'next/image';
import { CloudUpload, Loader2, X, Download } from 'lucide-react';
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
    const [wireframeImage, setWireframeImage] = useState<string | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const handleImageSelect = (event: ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && files[0]) {
            const file = files[0];
            setOriginalFile(file);
            const previewUrl = URL.createObjectURL(file);
            setOriginalPreview(previewUrl);
            setWireframeImage(null);
        }
    };

    const generateWireframeCanvas = (wireframeData: string, styleType: string) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size - taller to accommodate full content
        canvas.width = 1200;
        canvas.height = 2000;

        // Background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Configure wireframe style (Visily.ai approach)
        let lineWidth, fontSize, headingSize, detailLevel;
        
        if (styleType === 'minimalist') {
            lineWidth = 1;
            fontSize = 10;
            headingSize = 14;
            detailLevel = 'low';
            ctx.strokeStyle = '#CCCCCC';
        } else if (styleType === 'detailed') {
            lineWidth = 2.5;
            fontSize = 12;
            headingSize = 18;
            detailLevel = 'high';
            ctx.strokeStyle = '#333333';
        } else {
            lineWidth = 1.5;
            fontSize = 11;
            headingSize = 16;
            detailLevel = 'medium';
            ctx.strokeStyle = '#666666';
        }
        
        ctx.lineWidth = lineWidth;
        ctx.font = `${fontSize}px Arial`;
        ctx.fillStyle = '#666666';

        // Helper: Draw image placeholder (Visily.ai style)
        const drawImagePlaceholder = (x: number, y: number, w: number, h: number, label?: string) => {
            ctx.strokeRect(x, y, w, h);
            
            if (detailLevel !== 'low') {
                // Draw X for image placeholder
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + w, y + h);
                ctx.moveTo(x + w, y);
                ctx.lineTo(x, y + h);
                ctx.stroke();
            }
            
            if (label && detailLevel === 'high') {
                const prevFont = ctx.font;
                ctx.font = `${fontSize - 2}px Arial`;
                ctx.fillStyle = '#999999';
                ctx.fillText(label, x + 10, y + h / 2);
                ctx.font = prevFont;
                ctx.fillStyle = '#666666';
            }
        };

        // Helper: Draw text lines (wireframe text representation)
        const drawTextLines = (x: number, y: number, count: number, width: number, lineHeight = 18) => {
            const textLineHeight = detailLevel === 'high' ? 3 : 2;
            for (let i = 0; i < count; i++) {
                const lineY = y + (i * lineHeight);
                const lineWidth = i === count - 1 ? width * 0.7 : width;
                ctx.fillRect(x, lineY, lineWidth, textLineHeight);
            }
        };

        // Helper: Draw button with proper styling
        const drawButton = (x: number, y: number, w: number, h: number, label: string, isYellow = false) => {
            if (isYellow && detailLevel !== 'low') {
                ctx.fillStyle = '#FFE680';
                ctx.fillRect(x, y, w, h);
            }
            ctx.strokeRect(x, y, w, h);
            
            const prevFont = ctx.font;
            const prevFill = ctx.fillStyle;
            ctx.font = `bold ${fontSize}px Arial`;
            ctx.fillStyle = '#333333';
            const textWidth = ctx.measureText(label).width;
            ctx.fillText(label, x + (w - textWidth) / 2, y + h / 2 + 4);
            ctx.font = prevFont;
            ctx.fillStyle = prevFill;
        };
        
        // Helper: Draw section header
        const drawSectionHeader = (y: number, title: string) => {
            if (detailLevel === 'low') return y;
            
            const prevFont = ctx.font;
            const prevFill = ctx.fillStyle;
            ctx.font = `bold ${headingSize}px Arial`;
            ctx.fillStyle = '#333333';
            ctx.fillText(title, 40, y + 30);
            ctx.font = prevFont;
            ctx.fillStyle = prevFill;
            return y + 60;
        };

        // Parse structured JSON data or fallback to text
        let layoutStructure: any = null;
        let currentY = 20;
        
        try {
            layoutStructure = typeof wireframeData === 'string' ? JSON.parse(wireframeData) : wireframeData;
        } catch (e) {
            console.log('Could not parse as JSON, using text fallback');
        }

        // RENDER FROM STRUCTURED JSON DATA
        if (layoutStructure && layoutStructure.sections && Array.isArray(layoutStructure.sections)) {
            layoutStructure.sections.forEach((section: any) => {
                
                // 1. NAVIGATION SECTION
                if (section.type === 'navigation') {
                    const navHeight = section.height || 70;
                    
                    // Background for dark theme
                    if (section.background === 'dark' && detailLevel !== 'low') {
                        ctx.fillStyle = '#F5F5F5';
                        ctx.fillRect(20, currentY, canvas.width - 40, navHeight);
                        ctx.fillStyle = '#666666';
                    }
                    
                    ctx.strokeRect(20, currentY, canvas.width - 40, navHeight);
                    
                    // Logo
                    if (section.hasLogo) {
                        ctx.strokeRect(40, currentY + 15, 100, 40);
                        if (detailLevel === 'high') {
                            const prevFont = ctx.font;
                            ctx.font = `bold ${fontSize + 2}px Arial`;
                            ctx.fillStyle = '#333333';
                            ctx.fillText('LOGO', 60, currentY + 40);
                            ctx.font = prevFont;
                            ctx.fillStyle = '#666666';
                        }
                    }
                    
                    const navStartX = section.hasLogo ? 160 : 40;
                    let navEndX = canvas.width - 60;
                    
                    // Phone/Search on right
                    if (section.hasPhone || section.hasSearch) {
                        const rightWidth = 160;
                        const rightX = canvas.width - 60 - rightWidth;
                        ctx.strokeRect(rightX, currentY + 20, rightWidth, 30);
                        if (detailLevel !== 'low') {
                            const label = section.hasPhone ? '📞 Phone' : '🔍 Search';
                            ctx.fillText(label, rightX + 10, currentY + 40);
                        }
                        navEndX = rightX - 20;
                    }
                    
                    // Menu items
                    const menuCount = section.menuItems || 4;
                    const availableWidth = navEndX - navStartX;
                    const itemWidth = Math.min(availableWidth / menuCount, 100);
                    const spacing = (availableWidth - (itemWidth * menuCount)) / (menuCount + 1);
                    
                    for (let i = 0; i < menuCount; i++) {
                        const x = navStartX + spacing + (i * (itemWidth + spacing));
                        ctx.strokeRect(x, currentY + 20, itemWidth, 30);
                        if (detailLevel !== 'low') {
                            const prevFont = ctx.font;
                            ctx.font = `${fontSize}px Arial`;
                            ctx.fillText(`Nav ${i + 1}`, x + 10, currentY + 40);
                            ctx.font = prevFont;
                        }
                    }
                    
                    currentY += navHeight + 30;
                }
                
                // 2. HERO SECTION
                else if (section.type === 'hero') {
                    const heroHeight = section.height || 520;
                    
                    if (section.layout === 'split') {
                        // Split layout: text + image side by side
                        const containerPadding = 40;
                        const contentWidth = canvas.width - (containerPadding * 2);
                        const gap = 40;
                        const leftWidth = (contentWidth - gap) * 0.5;
                        const rightWidth = (contentWidth - gap) * 0.5;
                        
                        const leftX = containerPadding;
                        const rightX = containerPadding + leftWidth + gap;
                        
                        const textX = section.textSide === 'left' ? leftX : rightX;
                        const imageX = section.imageSide === 'right' ? rightX : leftX;
                        const textWidth = leftWidth;
                        
                        // TEXT SIDE
                        let textY = currentY + 100;
                        const textPadding = 30;
                        
                        if (section.hasGreeting && detailLevel !== 'low') {
                            const prevFont = ctx.font;
                            ctx.font = `${fontSize + 2}px Arial`;
                            ctx.fillStyle = '#999999';
                            drawTextLines(textX + textPadding, textY, 1, 100, 15);
                            ctx.font = prevFont;
                            ctx.fillStyle = '#666666';
                            textY += 40;
                        }
                        
                        if (section.hasHeading) {
                            const prevFont = ctx.font;
                            ctx.font = `bold ${headingSize * 2.2}px Arial`;
                            ctx.fillStyle = '#1a1a1a';
                            drawTextLines(textX + textPadding, textY, 1, textWidth - 60, 25);
                            ctx.font = prevFont;
                            ctx.fillStyle = '#666666';
                            textY += 60;
                        }
                        
                        if (section.hasSubtitle) {
                            const prevFont = ctx.font;
                            ctx.font = `${headingSize + 2}px Arial`;
                            drawTextLines(textX + textPadding, textY, 1, textWidth * 0.7, 20);
                            ctx.font = prevFont;
                            textY += 50;
                        }
                        
                        if (section.hasDescription && detailLevel !== 'low') {
                            drawTextLines(textX + textPadding, textY, 2, textWidth - 80, 18);
                            textY += 60;
                        }
                        
                        if (section.hasButton) {
                            const isYellow = section.buttonColor === 'yellow' || section.buttonColor === 'gold';
                            const buttonText = section.buttonText || 'Button';
                            drawButton(textX + textPadding, textY + 20, 160, 48, buttonText, isYellow);
                            textY += 90;
                        }
                        
                        if (section.hasSocialIcons && detailLevel !== 'low') {
                            const socialY = currentY + heroHeight - 70;
                            const socialCount = section.socialCount || 4;
                            
                            ctx.fillStyle = '#888888';
                            ctx.font = `${fontSize - 1}px Arial`;
                            ctx.fillText('Social:', textX + textPadding, socialY - 5);
                            
                            for (let i = 0; i < socialCount; i++) {
                                const iconX = textX + textPadding + 60 + (i * 45);
                                ctx.beginPath();
                                ctx.arc(iconX, socialY + 8, 14, 0, 2 * Math.PI);
                                ctx.stroke();
                            }
                            
                            ctx.fillStyle = '#666666';
                            ctx.font = `${fontSize}px Arial`;
                        }
                        
                        // IMAGE SIDE
                        drawImagePlaceholder(
                            imageX,
                            currentY + 50,
                            rightWidth,
                            heroHeight - 100,
                            'Hero Image'
                        );
                        
                    } else {
                        // Full-width hero
                        drawImagePlaceholder(20, currentY, canvas.width - 40, heroHeight, 'Hero Background');
                        
                        if (detailLevel !== 'low') {
                            const overlayX = 80;
                            const overlayY = currentY + heroHeight / 2 - 80;
                            
                            const prevFont = ctx.font;
                            ctx.font = `bold ${headingSize * 1.8}px Arial`;
                            ctx.fillStyle = '#1a1a1a';
                            drawTextLines(overlayX, overlayY, 1, 400, 25);
                            
                            ctx.font = `${fontSize + 2}px Arial`;
                            ctx.fillStyle = '#666666';
                            drawTextLines(overlayX, overlayY + 50, 2, 500, 18);
                            
                            if (section.hasButton) {
                                const buttonText = section.buttonText || 'CTA';
                                drawButton(overlayX, overlayY + 110, 180, 48, buttonText);
                            }
                            
                            ctx.font = prevFont;
                            ctx.fillStyle = '#666666';
                        }
                    }
                    
                    currentY += heroHeight + 50;
                }
                
                // 3. GALLERY SECTION
                else if (section.type === 'gallery') {
                    const imageCount = section.imageCount || 6;
                    const columns = section.columns || 3;
                    const rows = section.rows || Math.ceil(imageCount / columns);
                    
                    const padding = 40;
                    const gap = 20;
                    const imgWidth = (canvas.width - (padding * 2) - (gap * (columns - 1))) / columns;
                    const imgHeight = 200;
                    
                    // Section header
                    if (detailLevel === 'high') {
                        ctx.strokeRect(20, currentY, canvas.width - 40, 50);
                        ctx.fillStyle = '#333333';
                        ctx.font = `bold ${headingSize}px Arial`;
                        ctx.fillText('GALLERY', 40, currentY + 30);
                        ctx.font = `${fontSize}px Arial`;
                        ctx.fillStyle = '#666666';
                        currentY += 70;
                    }
                    
                    for (let i = 0; i < imageCount; i++) {
                        const row = Math.floor(i / columns);
                        const col = i % columns;
                        const x = padding + (col * (imgWidth + gap));
                        const y = currentY + (row * (imgHeight + gap));
                        
                        drawImagePlaceholder(x, y, imgWidth, imgHeight, detailLevel === 'high' ? `Image ${i + 1}` : '');
                    }
                    
                    currentY += (rows * (imgHeight + gap)) + 40;
                }
                
                // 4. CARDS SECTION
                else if (section.type === 'cards') {
                    const cardCount = section.count || 3;
                    const columns = section.columns || 3;
                    const padding = 40;
                    const gap = 20;
                    const cardWidth = (canvas.width - (padding * 2) - (gap * (columns - 1))) / columns;
                    
                    for (let i = 0; i < cardCount; i++) {
                        const x = padding + (i * (cardWidth + gap));
                        ctx.strokeRect(x, currentY, cardWidth, 280);
                        
                        if (section.hasImages) {
                            drawImagePlaceholder(x + 20, currentY + 20, cardWidth - 40, 120, '');
                        }
                        
                        if (section.hasText && detailLevel !== 'low') {
                            const textY = section.hasImages ? currentY + 160 : currentY + 40;
                            
                            const prevFont = ctx.font;
                            ctx.font = `bold ${fontSize + 2}px Arial`;
                            ctx.fillStyle = '#333333';
                            drawTextLines(x + 20, textY, 1, cardWidth - 40, 20);
                            
                            ctx.font = `${fontSize}px Arial`;
                            ctx.fillStyle = '#666666';
                            drawTextLines(x + 20, textY + 30, 3, cardWidth - 40, 18);
                            
                            ctx.font = prevFont;
                        }
                    }
                    
                    currentY += 320;
                }
                
                // 5. FORM SECTION
                else if (section.type === 'form') {
                    const formWidth = 500;
                    const formX = (canvas.width - formWidth) / 2;
                    const fields = section.fields || ['Name', 'Email'];
                    const buttonText = section.buttonText || 'Submit';
                    
                    ctx.strokeRect(formX, currentY, formWidth, 60 + (fields.length * 60) + 80);
                    
                    if (detailLevel === 'high') {
                        ctx.fillStyle = '#333333';
                        ctx.font = `bold ${headingSize}px Arial`;
                        ctx.fillText('FORM', formX + 20, currentY + 35);
                        ctx.font = `${fontSize}px Arial`;
                        ctx.fillStyle = '#666666';
                    }
                    
                    let fieldY = currentY + 70;
                    for (let i = 0; i < fields.length; i++) {
                        if (detailLevel !== 'low') {
                            ctx.fillText(fields[i], formX + 20, fieldY);
                        }
                        ctx.strokeRect(formX + 20, fieldY + 5, formWidth - 40, 35);
                        fieldY += 60;
                    }
                    
                    drawButton(formX + formWidth / 2 - 75, fieldY + 10, 150, 40, buttonText);
                    
                    currentY += 60 + (fields.length * 60) + 100;
                }
                
                // 6. TESTIMONIALS SECTION
                else if (section.type === 'testimonials') {
                    const count = section.count || 3;
                    const columns = section.columns || 3;
                    const padding = 40;
                    const gap = 20;
                    const cardWidth = (canvas.width - (padding * 2) - (gap * (columns - 1))) / columns;
                    
                    if (detailLevel === 'high') {
                        ctx.strokeRect(20, currentY, canvas.width - 40, 50);
                        ctx.fillStyle = '#333333';
                        ctx.font = `bold ${headingSize}px Arial`;
                        ctx.fillText('TESTIMONIALS', 40, currentY + 30);
                        ctx.font = `${fontSize}px Arial`;
                        ctx.fillStyle = '#666666';
                        currentY += 70;
                    }
                    
                    for (let i = 0; i < count; i++) {
                        const x = padding + (i * (cardWidth + gap));
                        ctx.strokeRect(x, currentY, cardWidth, 220);
                        
                        // Profile circle
                        ctx.beginPath();
                        ctx.arc(x + cardWidth / 2, currentY + 35, 20, 0, 2 * Math.PI);
                        ctx.stroke();
                        
                        // Quote text
                        if (detailLevel !== 'low') {
                            drawTextLines(x + 20, currentY + 70, 4, cardWidth - 40, 18);
                            
                            ctx.fillStyle = '#333333';
                            ctx.font = `bold ${fontSize}px Arial`;
                            ctx.fillText('Name', x + 20, currentY + 180);
                            ctx.font = `${fontSize}px Arial`;
                            ctx.fillStyle = '#666666';
                        }
                    }
                    
                    currentY += 260;
                }
                
                // 7. FOOTER SECTION
                else if (section.type === 'footer') {
                    const footerHeight = section.height || 200;
                    const columns = section.columns || 4;
                    const columnWidth = (canvas.width - 80) / columns;
                    
                    ctx.strokeRect(20, currentY, canvas.width - 40, footerHeight);
                    
                    if (detailLevel !== 'low') {
                        ctx.fillStyle = '#333333';
                        ctx.font = `bold ${fontSize + 2}px Arial`;
                        ctx.fillText('FOOTER', 40, currentY + 30);
                        ctx.font = `${fontSize}px Arial`;
                        ctx.fillStyle = '#666666';
                        
                        // Footer columns
                        for (let i = 0; i < columns; i++) {
                            const x = 40 + (i * columnWidth);
                            
                            ctx.fillStyle = '#333333';
                            ctx.font = `bold ${fontSize}px Arial`;
                            ctx.fillText(`Column ${i + 1}`, x, currentY + 65);
                            
                            ctx.font = `${fontSize}px Arial`;
                            ctx.fillStyle = '#666666';
                            
                            if (detailLevel === 'high') {
                                for (let j = 0; j < 4; j++) {
                                    ctx.fillText('Link', x, currentY + 90 + (j * 20));
                                }
                            }
                        }
                        
                        // Copyright
                        ctx.fillText('© Copyright', canvas.width / 2 - 40, currentY + footerHeight - 20);
                    }
                    
                    currentY += footerHeight + 20;
                }
            });
            
            // Trim canvas height
            const finalHeight = Math.min(currentY + 40, 2000);
            if (finalHeight < canvas.height) {
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = canvas.width;
                tempCanvas.height = finalHeight;
                const tempCtx = tempCanvas.getContext('2d');
                if (tempCtx) {
                    tempCtx.drawImage(canvas, 0, 0);
                    canvas.height = finalHeight;
                    const finalCtx = canvas.getContext('2d');
                    if (finalCtx) {
                        finalCtx.drawImage(tempCanvas, 0, 0);
                    }
                }
            }
            
            const wireframeDataUrl = canvas.toDataURL('image/png');
            setWireframeImage(wireframeDataUrl);
            return;
        }

        // FALLBACK: Text-based parsing (if JSON fails)
        const text = typeof wireframeData === 'string' ? wireframeData.toLowerCase() : JSON.stringify(wireframeData).toLowerCase();

        // Smart section detection with improved patterns
        const hasNavigation = text.includes('navigation') || text.includes('nav') || text.includes('menu') || 
                             text.includes('header') && (text.includes('items') || text.includes('links'));
        
        const hasHero = text.includes('hero') || text.includes('banner') || 
                       text.includes('large image') || text.includes('main image') ||
                       text.includes('background image') || 
                       (text.includes('split') && text.includes('layout'));
        
        const hasLogo = text.includes('logo') || text.includes('brand');
        
        const hasGallery = text.includes('gallery') || text.includes('image grid') || 
                          text.match(/\d+\s*images?\s*(?:in|arranged)/);
        
        const hasForm = text.includes('form') || text.includes('input') || 
                       text.includes('field') && (text.includes('text') || text.includes('email'));
        
        const hasTestimonials = text.includes('testimonial') || text.includes('review');
        
        const hasFooter = text.includes('footer') || text.includes('bottom');
        
        const hasCards = text.includes('card') || text.includes('feature') && text.includes('grid');
        
        // Detect split layout (text + image side-by-side)
        const isSplitLayout = text.includes('split') || 
                             (text.includes('text') && text.includes('image') && 
                              (text.includes('left') || text.includes('right') || text.includes('side')));
        
        const textOnLeft = text.includes('text on left') || text.includes('text on the left') ||
                          text.includes('left side') && text.includes('text');
        
        const imageOnRight = text.includes('image on right') || text.includes('image on the right') ||
                            text.includes('right side') && text.includes('image');
        
        // Detect social media icons
        const hasSocialIcons = text.includes('social') || text.includes('instagram') || 
                              text.includes('icon') && (text.includes('bottom') || text.includes('left'));
        
        // Detect phone number or contact info
        const hasPhoneNumber = text.includes('phone') || text.includes('contact number') || 
                              text.match(/\+?\d{2,3}[- ]?\d{3,}/);
        
        // Detect dark/light theme
        const hasDarkNav = text.includes('dark') && (text.includes('navigation') || text.includes('header'));

        // Extract numbers with better regex patterns
        const navItemsMatch = text.match(/(\d+)\s*(?:navigation|nav|menu|header)?\s*(?:items?|links?|buttons?)/);
        const navItemCount = navItemsMatch ? Number.parseInt(navItemsMatch[1]) : 
                            text.match(/\b(home|about|services|portfolio|contact|work|blog)\b/gi)?.length || 5;
        
        const imageCountMatch = text.match(/(\d+)\s*(?:images?|photos?)/);
        const imageCount = imageCountMatch ? Number.parseInt(imageCountMatch[1]) : 3;
        
        const columnMatch = text.match(/(\d+)[-\s]*(?:col|column)/);
        const columnCount = columnMatch ? Number.parseInt(columnMatch[1]) : 3;

        // 1. HEADER / NAVIGATION (Visily.ai style)
        if (hasNavigation || hasLogo) {
            const navHeight = 70;
            const navPadding = 40;
            
            // Background for dark theme
            if (hasDarkNav && detailLevel !== 'low') {
                ctx.fillStyle = '#F5F5F5';
                ctx.fillRect(20, currentY, canvas.width - 40, navHeight);
            }
            
            ctx.strokeRect(20, currentY, canvas.width - 40, navHeight);
            
            // Logo
            if (hasLogo) {
                ctx.strokeRect(navPadding, currentY + 15, 100, 40);
                if (detailLevel === 'high') {
                    const prevFont = ctx.font;
                    ctx.font = `bold ${fontSize + 2}px Arial`;
                    ctx.fillStyle = '#333333';
                    ctx.fillText('LOGO', navPadding + 30, currentY + 40);
                    ctx.font = prevFont;
                }
            }
            
            // Navigation layout
            const navStartX = hasLogo ? navPadding + 120 : navPadding;
            let navEndX = canvas.width - navPadding;
            
            // Phone/CTA on right
            if (hasPhoneNumber && detailLevel !== 'low') {
                const phoneWidth = 160;
                const phoneX = canvas.width - navPadding - phoneWidth;
                ctx.strokeRect(phoneX, currentY + 20, phoneWidth, 30);
                
                if (detailLevel === 'high') {
                    ctx.fillStyle = '#666666';
                    const prevFont = ctx.font;
                    ctx.font = `${fontSize}px Arial`;
                    ctx.fillText('☎ Phone', phoneX + 40, currentY + 40);
                    ctx.font = prevFont;
                }
                navEndX = phoneX - 20;
            }
            
            // Navigation items
            const availableWidth = navEndX - navStartX;
            const navItemWidth = Math.min(availableWidth / navItemCount, 100);
            const spacing = (availableWidth - (navItemWidth * navItemCount)) / (navItemCount + 1);
            
            for (let i = 0; i < navItemCount; i++) {
                const x = navStartX + spacing + (i * (navItemWidth + spacing));
                ctx.strokeRect(x, currentY + 20, navItemWidth, 30);
                
                if (detailLevel !== 'low') {
                    const prevFont = ctx.font;
                    ctx.font = `${fontSize}px Arial`;
                    ctx.fillStyle = '#666666';
                    const textWidth = ctx.measureText(`Nav ${i + 1}`).width;
                    ctx.fillText(`Nav ${i + 1}`, x + (navItemWidth - textWidth) / 2, currentY + 40);
                    ctx.font = prevFont;
                }
            }
            
            ctx.fillStyle = '#666666';
            currentY += navHeight + 30;
        }

        // 2. HERO SECTION (Visily.ai style rendering)
        if (hasHero) {
            const heroHeight = isSplitLayout ? 540 : 380;
            
            if (isSplitLayout) {
                // Split layout: Text + Image side-by-side
                const containerPadding = 40;
                const contentWidth = canvas.width - (containerPadding * 2);
                const splitRatio = 0.5; // 50-50 split
                const gap = 40;
                
                const leftWidth = contentWidth * splitRatio - gap / 2;
                const rightWidth = contentWidth * splitRatio - gap / 2;
                
                const leftX = containerPadding;
                const rightX = containerPadding + leftWidth + gap;
                
                // Determine which side has text vs image
                const textX = textOnLeft || !imageOnRight ? leftX : rightX;
                const imageX = textOnLeft || !imageOnRight ? rightX : leftX;
                const textContentWidth = leftWidth;
                const imageContentWidth = rightWidth;
                
                // CONTAINER OUTLINE (for detailed mode)
                if (detailLevel === 'high') {
                    ctx.save();
                    ctx.strokeStyle = '#EEEEEE';
                    ctx.setLineDash([5, 5]);
                    ctx.strokeRect(20, currentY, canvas.width - 40, heroHeight);
                    ctx.setLineDash([]);
                    ctx.restore();
                }
                
                // TEXT SIDE
                const textPaddingY = 80;
                const textStartY = currentY + textPaddingY;
                const textPaddingX = 30;
                
                // Greeting/intro (small text)
                if (detailLevel !== 'low') {
                    const prevFont = ctx.font;
                    ctx.font = `${fontSize + 2}px Arial`;
                    ctx.fillStyle = '#999999';
                    drawTextLines(textX + textPaddingX, textStartY, 1, 100, 15);
                    ctx.font = prevFont;
                }
                
                // Main heading (large, bold)
                const headingY = textStartY + 40;
                const prevFont = ctx.font;
                ctx.font = `bold ${headingSize * 2.2}px Arial`;
                ctx.fillStyle = '#1a1a1a';
                drawTextLines(textX + textPaddingX, headingY, 1, textContentWidth - 60, 25);
                
                // Subtitle/role
                ctx.font = `${headingSize + 2}px Arial`;
                ctx.fillStyle = '#555555';
                drawTextLines(textX + textPaddingX, headingY + 60, 1, textContentWidth * 0.7, 20);
                
                // Description
                ctx.font = `${fontSize}px Arial`;
                ctx.fillStyle = '#666666';
                if (detailLevel !== 'low') {
                    drawTextLines(textX + textPaddingX, headingY + 110, 2, textContentWidth - 80, 18);
                }
                ctx.font = prevFont;
                
                // CTA Button
                const hasButton = text.includes('button') || text.includes('hire') || 
                                 text.includes('cta') || text.includes('get started');
                if (hasButton) {
                    const buttonY = headingY + 160;
                    const isYellowButton = text.includes('hire') || text.includes('yellow');
                    drawButton(textX + textPaddingX, buttonY, 160, 48, 'CTA Button', isYellowButton);
                }
                
                // Social icons at bottom
                if (hasSocialIcons && detailLevel !== 'low') {
                    const socialY = currentY + heroHeight - 60;
                    const prevFont = ctx.font;
                    ctx.font = `${fontSize - 1}px Arial`;
                    ctx.fillStyle = '#888888';
                    ctx.fillText('Social:', textX + textPaddingX, socialY - 5);
                    
                    for (let i = 0; i < 4; i++) {
                        const iconX = textX + textPaddingX + 60 + (i * 45);
                        ctx.beginPath();
                        ctx.arc(iconX, socialY + 8, 14, 0, 2 * Math.PI);
                        ctx.stroke();
                    }
                    ctx.font = prevFont;
                }
                
                // IMAGE SIDE
                const imagePaddingY = 50;
                drawImagePlaceholder(
                    imageX,
                    currentY + imagePaddingY,
                    imageContentWidth,
                    heroHeight - (imagePaddingY * 2),
                    'HERO IMAGE'
                );
                
            } else {
                // Full-width hero with overlay
                drawImagePlaceholder(20, currentY, canvas.width - 40, heroHeight, 'HERO');
                
                if (detailLevel !== 'low') {
                    const overlayX = 80;
                    const overlayY = currentY + heroHeight / 2 - 80;
                    
                    const prevFont = ctx.font;
                    ctx.font = `bold ${headingSize * 1.8}px Arial`;
                    ctx.fillStyle = '#1a1a1a';
                    drawTextLines(overlayX, overlayY, 1, 400, 25);
                    
                    ctx.font = `${fontSize + 2}px Arial`;
                    ctx.fillStyle = '#666666';
                    drawTextLines(overlayX, overlayY + 50, 2, 500, 18);
                    
                    if (text.includes('button')) {
                        drawButton(overlayX, overlayY + 110, 180, 48, 'CTA');
                    }
                    ctx.font = prevFont;
                }
            }
            
            ctx.fillStyle = '#666666';
            ctx.font = `${fontSize}px Arial`;
            currentY += heroHeight + 50;
        }

        // 3. RESERVATION FORM / CONTACT FORM
        if (hasForm) {
            const formWidth = 500;
            const formX = (canvas.width - formWidth) / 2;
            
            ctx.strokeRect(formX, currentY, formWidth, 320);
            ctx.fillText('FORM SECTION', formX + 10, currentY + 25);
            
            // Form fields
            const fields = ['Name', 'Email', 'Phone', 'Date', 'Time', 'Number of Guests'];
            const fieldsToShow = text.includes('reservation') ? fields : fields.slice(0, 3);
            
            fieldsToShow.forEach((field, idx) => {
                const fieldY = currentY + 50 + (idx * 60);
                ctx.fillText(field, formX + 20, fieldY);
                ctx.strokeRect(formX + 20, fieldY + 5, formWidth - 40, 35);
            });
            
            // Submit button
            const buttonY = currentY + 50 + (fieldsToShow.length * 60);
            drawButton(formX + formWidth / 2 - 75, buttonY, 150, 40, 'Submit');
            
            currentY += 360;
        }

        // 4. IMAGE GALLERY / FOOD GALLERY
        if (hasGallery) {
            ctx.strokeRect(20, currentY, canvas.width - 40, 50);
            ctx.fillText('GALLERY SECTION', 40, currentY + 30);
            currentY += 70;
            
            // Determine grid layout
            const columns = imageCount <= 2 ? imageCount : imageCount <= 4 ? 2 : 3;
            const rows = Math.ceil(imageCount / columns);
            
            const galleryPadding = 40;
            const gap = 20;
            const imageWidth = (canvas.width - (galleryPadding * 2) - (gap * (columns - 1))) / columns;
            const imageHeight = 200;
            
            for (let i = 0; i < imageCount; i++) {
                const row = Math.floor(i / columns);
                const col = i % columns;
                const x = galleryPadding + (col * (imageWidth + gap));
                const y = currentY + (row * (imageHeight + gap));
                
                drawImagePlaceholder(x, y, imageWidth, imageHeight, `Image ${i + 1}`);
            }
            
            currentY += (rows * (imageHeight + gap)) + 40;
        }

        // 5. FEATURE CARDS / CONTENT BLOCKS
        if (hasCards && !hasTestimonials && !hasGallery) {
            const cardCount = columnCount || 3;
            const cardPadding = 40;
            const cardGap = 20;
            const totalWidth = canvas.width - (cardPadding * 2);
            const cardWidth = (totalWidth - (cardGap * (cardCount - 1))) / cardCount;
            
            // Section header
            ctx.strokeRect(20, currentY, canvas.width - 40, 60);
            ctx.fillStyle = '#333333';
            ctx.font = 'bold 18px Arial';
            ctx.fillText('SECTION HEADING', 40, currentY + 35);
            ctx.font = '12px Arial';
            ctx.fillStyle = '#666666';
            currentY += 80;
            
            for (let i = 0; i < cardCount; i++) {
                const x = cardPadding + (i * (cardWidth + cardGap));
                ctx.strokeRect(x, currentY, cardWidth, 280);
                
                // Card icon/image
                drawImagePlaceholder(x + 20, currentY + 20, cardWidth - 40, 120, 'Icon');
                
                // Card title
                ctx.fillStyle = '#333333';
                ctx.font = 'bold 14px Arial';
                ctx.fillText('Feature Title', x + 20, currentY + 165);
                
                // Card description
                ctx.font = '12px Arial';
                ctx.fillStyle = '#666666';
                drawTextLines(x + 20, currentY + 190, 4, cardWidth - 40);
            }
            
            currentY += 320;
        }

        // 6. TESTIMONIALS SECTION
        if (hasTestimonials) {
            ctx.strokeRect(20, currentY, canvas.width - 40, 50);
            ctx.fillText('TESTIMONIALS', 40, currentY + 30);
            currentY += 70;
            
            const testimonialCount = 3;
            const testimonialWidth = (canvas.width - 120) / testimonialCount;
            
            for (let i = 0; i < testimonialCount; i++) {
                const x = 40 + (i * (testimonialWidth + 20));
                
                // Testimonial card
                ctx.strokeRect(x, currentY, testimonialWidth, 200);
                
                // Quote icon / profile pic
                ctx.beginPath();
                ctx.arc(x + testimonialWidth / 2, currentY + 30, 20, 0, 2 * Math.PI);
                ctx.stroke();
                
                // Quote text
                drawTextLines(x + 20, currentY + 70, 4, testimonialWidth - 40);
                
                // Author name
                ctx.fillText('Customer Name', x + 20, currentY + 170);
            }
            
            currentY += 240;
        }

        // 7. FOOTER
        if (hasFooter) {
            const footerHeight = 200;
            const footerColumns = 4;
            const columnWidth = (canvas.width - 80) / footerColumns;
            
            ctx.strokeRect(20, currentY, canvas.width - 40, footerHeight);
            ctx.fillText('FOOTER', 40, currentY + 25);
            
            // Footer columns
            for (let i = 0; i < footerColumns; i++) {
                const x = 40 + (i * columnWidth);
                
                // Column title
                ctx.fillStyle = '#333333';
                ctx.font = 'bold 12px Arial';
                ctx.fillText(`Column ${i + 1}`, x, currentY + 50);
                
                // Column links
                ctx.font = '12px Arial';
                ctx.fillStyle = '#666666';
                for (let j = 0; j < 5; j++) {
                    ctx.fillText('Link', x, currentY + 75 + (j * 20));
                }
            }
            
            // Copyright
            currentY += footerHeight - 30;
            ctx.fillText('© Copyright Notice', canvas.width / 2 - 60, currentY);
        }

        // Trim canvas to actual content height
        const finalHeight = Math.min(currentY + 40, 2000);
        if (finalHeight < canvas.height) {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvas.width;
            tempCanvas.height = finalHeight;
            const tempCtx = tempCanvas.getContext('2d');
            if (tempCtx) {
                tempCtx.drawImage(canvas, 0, 0);
                canvas.height = finalHeight;
                const finalCtx = canvas.getContext('2d');
                if (finalCtx) {
                    finalCtx.drawImage(tempCanvas, 0, 0);
                }
            }
        }

        // Convert canvas to image
        const wireframeDataUrl = canvas.toDataURL('image/png');
        setWireframeImage(wireframeDataUrl);
    };

    const handleConvert = async () => {
        if (!originalFile) {
            toast.error('Please upload a UI design image');
            return;
        }

        setLoading(true);
        setWireframeImage(null);

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
                // Generate wireframe canvas based on analysis
                generateWireframeCanvas(response.data.wireframeData, response.data.style);
                toast.success('Wireframe generated successfully! (1 credit used)');
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

    const handleDownload = () => {
        if (wireframeImage) {
            const link = document.createElement('a');
            link.download = 'wireframe.png';
            link.href = wireframeImage;
            link.click();
        }
    };

    const handleReset = () => {
        setOriginalFile(null);
        setOriginalPreview(null);
        setWireframeImage(null);
        setDescription('');
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            
            <div className="mb-6">
                <h1 className="text-3xl font-bold">Convert UI to Wireframe</h1>
                <p className="text-gray-600 mt-2">
                    Upload a finished UI design and AI will convert it to a wireframe image (Costs 1 credit)
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
                        {(originalPreview || wireframeImage) && (
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
                                        setWireframeImage(null);
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
                    <h2 className="font-semibold text-lg">Generated Wireframe</h2>
                    <div className="border-2 border-dashed rounded-lg p-4 flex items-center justify-center min-h-[400px]">
                        {loading ? (
                            <div className="text-center">
                                <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
                                <p className="text-gray-600 font-medium">Analyzing UI and generating wireframe...</p>
                                <p className="text-sm text-gray-500 mt-2">This may take 30-60 seconds</p>
                            </div>
                        ) : wireframeImage ? (
                            <div className="space-y-4 w-full">
                                <div className="relative w-full h-[400px] bg-white">
                                    <Image
                                        src={wireframeImage}
                                        alt="Generated Wireframe"
                                        fill
                                        className="object-contain rounded-lg"
                                    />
                                </div>
                                <Button
                                    onClick={handleDownload}
                                    className="w-full"
                                    variant="outline"
                                >
                                    <Download className="mr-2 h-4 w-4" />
                                    Download Wireframe
                                </Button>
                            </div>
                        ) : (
                            <div className="text-center text-gray-400">
                                <p>Your wireframe will appear here</p>
                                <p className="text-sm mt-2">Upload a UI design to get started</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default UIToWireframe;
