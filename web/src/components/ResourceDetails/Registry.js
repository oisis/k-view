import React from 'react';

// Dumb components - RESTORED FULL LIST FROM MAIN
import PodOverview from './templates/PodOverview';
import DeploymentOverview from './templates/DeploymentOverview';
import ServiceOverview from './templates/ServiceOverview';
import CronJobOverview from './templates/CronJobOverview';
import NodeOverview from './templates/NodeOverview';
import ConfigMapOverview from './templates/ConfigMapOverview';
import IngressOverview from './templates/IngressOverview';
import StatefulSetOverview from './templates/StatefulSetOverview';
import PvcOverview from './templates/PvcOverview';
import RbacOverview from './templates/RbacOverview';
import NamespaceOverview from './templates/NamespaceOverview';
import CrdOverview from './templates/CrdOverview';
import IngressClassOverview from './templates/IngressClassOverview';
import SecretOverview from './templates/SecretOverview';
import StorageClassOverview from './templates/StorageClassOverview';
import NetworkPolicyOverview from './templates/NetworkPolicyOverview';
import ServiceAccountOverview from './templates/ServiceAccountOverview';
import PvOverview from './templates/PvOverview';
import RbacBindingOverview from './templates/RbacBindingOverview';
import DaemonSetOverview from './templates/DaemonSetOverview';
import JobOverview from './templates/JobOverview';
import HpaOverview from './templates/HpaOverview';
import ReplicaSetOverview from './templates/ReplicaSetOverview';
import ReplicationControllerOverview from './templates/ReplicationControllerOverview';

import GenericDetails from './templates/GenericDetails';

const REGISTRY = {
    'pods': PodOverview,
    'pod': PodOverview,
    'deployments': DeploymentOverview,
    'deployment': DeploymentOverview,
    'services': ServiceOverview,
    'service': ServiceOverview,
    'cronjobs': CronJobOverview,
    'cronjob': CronJobOverview,
    'nodes': NodeOverview,
    'node': NodeOverview,
    'configmaps': ConfigMapOverview,
    'configmap': ConfigMapOverview,
    'ingresses': IngressOverview,
    'ingress': IngressOverview,
    'statefulsets': StatefulSetOverview,
    'statefulset': StatefulSetOverview,
    'persistentvolumeclaims': PvcOverview,
    'pvc': PvcOverview,
    'roles': RbacOverview,
    'clusterroles': RbacOverview,
    'namespaces': NamespaceOverview,
    'customresourcedefinitions': CrdOverview,
    'ingressclasses': IngressClassOverview,
    'secrets': SecretOverview,
    'storageclasses': StorageClassOverview,
    'networkpolicies': NetworkPolicyOverview,
    'serviceaccounts': ServiceAccountOverview,
    'persistentvolumes': PvOverview,
    'rolebindings': RbacBindingOverview,
    'clusterrolebindings': RbacBindingOverview,
    'daemonsets': DaemonSetOverview,
    'jobs': JobOverview,
    'horizontalpodautoscalers': HpaOverview,
    'replicasets': ReplicaSetOverview,
    'replicationcontrollers': ReplicationControllerOverview,
};

/**
 * Registry Pattern for Resource Details.
 * Maps kind to specific Overview component or Fallback.
 * RESTORED: All specific templates from main branch.
 */
export function getResourceComponent(kind) {
    const key = (kind || '').toLowerCase().replace(/-/g, '');
    return REGISTRY[key] || GenericDetails;
}
