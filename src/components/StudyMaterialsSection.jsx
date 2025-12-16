// File: src/components/StudyMaterialsSection.jsx

import React, { useState } from 'react';
import { useTimer } from './context/TimerContext';
import { 
    XMarkIcon, 
    LinkIcon, 
    DocumentIcon, 
    FolderPlusIcon, 
    TrashIcon, 
    ArrowUpTrayIcon 
} from '@heroicons/react/24/outline';


const StudyMaterialsSection = () => {
    const { 
        materials, 
        setMaterials, 
        selectMaterial, 
        isActive, 
    } = useTimer();
    
    const [isUploading, setIsUploading] = useState(false);

    // FOCUS ENFORCER: Only render if timer is active
    if (!isActive) return null;

    const UploadForm = () => {
        const [uploadType, setUploadType] = useState('file');
        const [name, setName] = useState('');
        const [value, setValue] = useState('');
        
        // DEMO-READY SUBMIT LOGIC
        const handleUploadSubmit = (e) => {
            e.preventDefault();
            
            // Check required fields based on type
            if (!name || (!value && uploadType === 'link')) return;
            // For file type, we just need the name and the value is the file name itself (set in onChange)
            if (!name && uploadType === 'file') return;


            // 1. Create a temporary, client-side ID for the new material
            const newMaterial = {
                id: `demo-${Date.now()}`,
                type: uploadType,
                name: name,
                // For files, use a dummy path with the file name; for links, use the real URL
                value: uploadType === 'file' ? `/path/to/demo/${value}` : value, 
                isFocus: false,
            };

            // 2. Add the new material to the list immediately
            setMaterials(prev => [...prev, newMaterial]);

            // 3. Reset form state and close the form
            setName('');
            setValue('');
            setIsUploading(false);
            
            console.log(`DEMO SUCCESS: Added new material: ${name} (${uploadType})`);
        };
        
        return (
            <form onSubmit={handleUploadSubmit} className="space-y-4 p-4 bg-slate-700 rounded-xl">
                <div className="flex space-x-4">
                    <button
                        type="button"
                        onClick={() => setUploadType('file')}
                        className={`py-2 px-4 rounded-full text-sm font-semibold transition-colors ${
                            uploadType === 'file' ? 'bg-cyan-600 text-white' : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                        }`}
                    >
                        <DocumentIcon className="h-4 w-4 inline mr-2"/> Upload File
                    </button>
                    <button
                        type="button"
                        onClick={() => setUploadType('link')}
                        className={`py-2 px-4 rounded-full text-sm font-semibold transition-colors ${
                            uploadType === 'link' ? 'bg-violet-600 text-white' : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                        }`}
                    >
                        <LinkIcon className="h-4 w-4 inline mr-2"/> External Link
                    </button>
                </div>
                
                <input
                    type="text"
                    placeholder="Material Name (e.g., Chapter 5 Notes)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full p-3 bg-slate-800 text-white rounded-lg placeholder-slate-400 focus:ring-violet-400 focus:ring-1 border-none"
                />
                
                {uploadType === 'link' ? (
                    <input
                        type="url"
                        placeholder="Paste full URL here (e.g., https://youtube.com/...)"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        required
                        className="w-full p-3 bg-slate-800 text-white rounded-lg placeholder-slate-400 focus:ring-violet-400 focus:ring-1 border-none"
                    />
                ) : (
                    // File selection for UI and setting the 'value' with the file name
                    <div className="w-full p-4 border-2 border-dashed border-slate-600 rounded-lg text-center bg-slate-800 relative">
                        <ArrowUpTrayIcon className="h-6 w-6 mx-auto text-cyan-400 mb-2"/>
                        <span className="text-slate-400 text-sm">Click here to select a file (PDF, Doc, etc.)</span>
                        <input
                            type="file"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            // Capture the file name for the demo display
                            onChange={(e) => setValue(e.target.files[0]?.name || '')}
                            required
                        />
                         {/* Display the selected file name */}
                        {value && <p className="text-sm text-cyan-300 mt-2 font-semibold">Selected: {value}</p>}
                    </div>
                )}
                
                <div className="flex justify-end space-x-2">
                    <button
                        type="button"
                        onClick={() => setIsUploading(false)}
                        className="py-2 px-4 text-sm font-semibold rounded-lg bg-slate-600 hover:bg-slate-500 text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="py-2 px-4 text-sm font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                    >
                        Upload & Save
                    </button>
                </div>
            </form>
        );
    }

    return (
        <div className="w-full mt-10">
            <h2 className="text-3xl font-bold text-violet-400 mb-6">In-App Study Center 📖</h2>
            
            <div className="grid grid-cols-1 max-w-lg mx-auto"> 
                
                <div className="w-full">
                    <div className="bg-slate-800 p-6 rounded-3xl shadow-xl border border-slate-700 h-[600px] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold text-white">Your Materials ({materials.length})</h3>
                            <button
                                onClick={() => setIsUploading(prev => !prev)}
                                className={`p-2 rounded-full transition-colors duration-200 ${
                                    isUploading ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'
                                }`}
                                title={isUploading ? "Close Upload" : "Add New Material"}
                            >
                                {isUploading ? (
                                    <XMarkIcon className="h-6 w-6 text-white" />
                                ) : (
                                    <FolderPlusIcon className="h-6 w-6 text-white" />
                                )}
                            </button>
                        </div>
                        
                        {isUploading ? (
                            <UploadForm />
                        ) : (
                            <div className="overflow-y-auto space-y-3 pr-2 flex-grow">
                                {materials.length > 0 ? (
                                    materials.map((mat) => (
                                        <div key={mat.id} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors">
                                            <button
                                                onClick={() => selectMaterial(mat)}
                                                className="flex-grow flex items-center space-x-3 text-left truncate"
                                            >
                                                {mat.type === 'link' ? (
                                                    <LinkIcon className="h-6 w-6 text-violet-400 flex-shrink-0" />
                                                ) : (
                                                    <DocumentIcon className="h-6 w-6 text-cyan-400 flex-shrink-0" />
                                                )}
                                                <span className="text-white font-medium truncate">{mat.name}</span>
                                            </button>
                                            <button 
                                                onClick={() => alert(`SIMULATED DELETE: ${mat.name}. Firestore deletion required.`)}
                                                className="p-1 ml-4 text-slate-400 hover:text-red-500 transition-colors"
                                                title="Delete Material"
                                            >
                                                <TrashIcon className="h-5 w-5" />
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-slate-400 italic text-center p-8">
                                        No materials added. Click the '+' to upload your study files or links.
                                    </p>
                                )}
                            </div>
                        )}
                        
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudyMaterialsSection;