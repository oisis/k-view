import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowLeft, Home } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { useTranslation } from '../SettingsContext';

const ErrorPage = ({ code = "404", message }) => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const defaultMessages = {
        "404": "The resource you are looking for does not exist or has been moved.",
        "403": "You do not have permission to view this resource.",
        "500": "An internal server error occurred while communicating with the cluster."
    };

    const displayMessage = message || defaultMessages[code] || "An unexpected error occurred.";

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="max-w-md w-full"
            >
                <Card className="glass-glow border-2 border-destructive/20 overflow-hidden">
                    <div className="p-8 text-center space-y-6">
                        <div className="inline-flex p-4 bg-destructive/10 text-destructive rounded-full mb-2">
                            <AlertTriangle size={48} strokeWidth={2.5} />
                        </div>
                        
                        <div className="space-y-2">
                            <h1 className="text-6xl font-black text-foreground/20 tracking-tighter">{code}</h1>
                            <h2 className="text-2xl font-bold text-foreground uppercase tracking-tight italic">
                                {code === "403" ? t('access_denied') : t('error_occurred')}
                            </h2>
                            <p className="text-muted-foreground text-sm leading-relaxed font-medium">
                                {displayMessage}
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 pt-4">
                            <Button 
                                variant="outline" 
                                className="flex-1 gap-2 rounded-xl border-border/50 font-bold uppercase text-[10px] tracking-widest"
                                onClick={() => navigate(-1)}
                            >
                                <ArrowLeft size={16} /> {t('go_back')}
                            </Button>
                            <Button 
                                className="flex-1 gap-2 rounded-xl bg-primary text-primary-foreground font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20"
                                onClick={() => navigate('/')}
                            >
                                <Home size={16} /> {t('dashboard')}
                            </Button>
                        </div>
                    </div>
                </Card>
            </motion.div>
        </div>
    );
};

export default ErrorPage;
