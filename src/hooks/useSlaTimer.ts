import { useState, useEffect, useRef } from 'react';

export interface SlaLimits {
  responseTimeLimit: number;
  resolutionTimeLimit: number;
}

export interface SlaTimerResult {
  responseTimeRemaining: number;
  resolutionTimeRemaining: number;
  responseTimeElapsed: number;
  resolutionTimeElapsed: number;
  isResponseOverdue: boolean;
  isResolutionOverdue: boolean;
  shouldShowResponseTimer: boolean;
  shouldShowResolutionTimer: boolean;
}

export function getSlaLimits(priority: string): SlaLimits {
  const priorityLower = priority.toLowerCase();
  
  switch (priorityLower) {
    case 'low':
      return {
        responseTimeLimit: 0, // Immediate bot response
        resolutionTimeLimit: 0, // Bot resolves or escalates
      };
    case 'medium':
      return {
        responseTimeLimit: 900, // 15 minutes
        resolutionTimeLimit: 172800, // 48 hours
      };
    case 'high':
      return {
        responseTimeLimit: 300, // 5 minutes
        resolutionTimeLimit: 86400, // 24 hours
      };
    default:
      return {
        responseTimeLimit: 900,
        resolutionTimeLimit: 172800,
      };
  }
}

export function useSlaTimer(
  createdAt: string,
  priority: string,
  status: string,
  assignedAt?: string | null,
  resolvedAt?: string | null,
  agentId?: string | null
): SlaTimerResult {
  const [currentTime, setCurrentTime] = useState(Date.now());
  const intervalRef = useRef<NodeJS.Timeout>();
  
  const slaLimits = getSlaLimits(priority);
  const createdTime = new Date(createdAt).getTime();
  const assignedTime = assignedAt ? new Date(assignedAt).getTime() : null;
  const resolvedTime = resolvedAt ? new Date(resolvedAt).getTime() : null;
  
  // Update current time every second
  useEffect(() => {
    const updateTimer = () => setCurrentTime(Date.now());
    
    intervalRef.current = setInterval(updateTimer, 1000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
  
  // Calculate response time metrics
  const responseTimeElapsed = Math.floor((currentTime - createdTime) / 1000);
  const responseTimeRemaining = Math.max(0, slaLimits.responseTimeLimit - responseTimeElapsed);
  const isResponseOverdue = responseTimeElapsed > slaLimits.responseTimeLimit && slaLimits.responseTimeLimit > 0;
  
  // Response timer should show for unassigned tickets (no agent assigned yet)
  const shouldShowResponseTimer = 
    !agentId && 
    status.toLowerCase() !== 'resolved' && 
    status.toLowerCase() !== 'overdue' &&
    slaLimits.responseTimeLimit > 0;
  
  // Calculate resolution time metrics
  let resolutionTimeElapsed = 0;
  let resolutionTimeRemaining = 0;
  let isResolutionOverdue = false;
  let shouldShowResolutionTimer = false;
  
  if (assignedTime && !resolvedTime) {
    // Resolution timer starts when ticket is assigned
    resolutionTimeElapsed = Math.floor((currentTime - assignedTime) / 1000);
    resolutionTimeRemaining = Math.max(0, slaLimits.resolutionTimeLimit - resolutionTimeElapsed);
    isResolutionOverdue = resolutionTimeElapsed > slaLimits.resolutionTimeLimit && slaLimits.resolutionTimeLimit > 0;
    
    shouldShowResolutionTimer = 
      agentId && 
      status.toLowerCase() !== 'resolved' &&
      slaLimits.resolutionTimeLimit > 0;
  } else if (resolvedTime && assignedTime) {
    // Ticket is resolved, show final resolution time
    resolutionTimeElapsed = Math.floor((resolvedTime - assignedTime) / 1000);
    resolutionTimeRemaining = 0;
    isResolutionOverdue = resolutionTimeElapsed > slaLimits.resolutionTimeLimit && slaLimits.resolutionTimeLimit > 0;
    shouldShowResolutionTimer = false; // Don't show timer for resolved tickets
  }
  
  return {
    responseTimeRemaining,
    resolutionTimeRemaining,
    responseTimeElapsed,
    resolutionTimeElapsed,
    isResponseOverdue,
    isResolutionOverdue,
    shouldShowResponseTimer,
    shouldShowResolutionTimer,
  };
}