import React from 'react';

// Dumb components (to be implemented/refactored)
import PodOverview from './templates/PodOverview';
import DeploymentOverview from './templates/DeploymentOverview';
import ServiceOverview from './templates/ServiceOverview';
import GenericDetails from './templates/GenericDetails';

const REGISTRY = {
    'pods': PodOverview,
    'pod': PodOverview,
    'deployments': DeploymentOverview,
    'deployment': DeploymentOverview,
    'services': ServiceOverview,
    'service': ServiceOverview,
};

/**
 * Registry Pattern for Resource Details.
 * Maps kind to specific Overview component or Fallback.
 */
export function getResourceComponent(kind) {
    const key = kind?.toLowerCase();
    return REGISTRY[key] || GenericDetails;
}
