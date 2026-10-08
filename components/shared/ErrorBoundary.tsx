'use client';

import React, { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 my-4 text-card-foreground shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-destructive/10 text-destructive shrink-0">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="space-y-2 flex-1 min-w-0">
              <h3 className="text-base font-semibold text-foreground">
                {this.props.fallbackTitle ?? 'Ocorreu um erro ao carregar este componente'}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {this.props.fallbackMessage ??
                  'Houve uma falha inesperada durante a renderização deste módulo. Você pode tentar recarregar.'}
              </p>
              {this.state.error?.message && (
                <div className="text-[11px] font-mono p-2.5 rounded-lg bg-background/80 border border-border text-destructive truncate max-w-xl">
                  {this.state.error.message}
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={this.handleReset}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Tentar novamente
                </button>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-semibold hover:bg-muted transition-colors cursor-pointer"
                >
                  Recarregar página
                </button>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-semibold hover:bg-muted transition-colors"
                >
                  <Home className="h-3.5 w-3.5" />
                  Ir para o Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
