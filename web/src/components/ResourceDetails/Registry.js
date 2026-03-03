import React from 'react';

// Dumb components - RESTORED FULL LIST FROM MAIN WITH NEW NAMING CONVENTION
import PodOverview from './templates/Pod-overview';
import DeploymentOverview from './templates/Deployment-overview';
import ServiceOverview from './templates/Service-overview';
import CronJobOverview from './templates/CronJob-overview';
import NodeOverview from './templates/Node-overview';
import ConfigMapOverview from './templates/ConfigMap-overview';
import IngressOverview from './templates/Ingress-overview';
import StatefulSetOverview from './templates/StatefulSet-overview';
import PvcOverview from './templates/PersistentVolumeClaim-overview';
import RoleOverview from './templates/Role-overview';
import ClusterRoleOverview from './templates/ClusterRole-overview';
import NamespaceOverview from './templates/Namespace-overview';
import CrdOverview from './templates/CustomResourceDefinition-overview';
import IngressClassOverview from './templates/IngressClass-overview';
import SecretOverview from './templates/Secret-overview';
import StorageClassOverview from './templates/StorageClass-overview';
import NetworkPolicyOverview from './templates/NetworkPolicy-overview';
import ServiceAccountOverview from './templates/ServiceAccount-overview';
import PvOverview from './templates/PersistentVolume-overview';
import RoleBindingOverview from './templates/RoleBinding-overview';
import ClusterRoleBindingOverview from './templates/ClusterRoleBinding-overview';
import DaemonSetOverview from './templates/DaemonSet-overview';
import JobOverview from './templates/Job-overview';
import HpaOverview from './templates/HorizontalPodAutoscaler-overview';
import ReplicaSetOverview from './templates/ReplicaSet-overview';
import ReplicationControllerOverview from './templates/ReplicationController-overview';
import EventOverview from './templates/Event-overview';

import GenericDetails from './templates/Generic-overview';

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
    'roles': RoleOverview,
    'role': RoleOverview,
    'clusterroles': ClusterRoleOverview,
    'clusterrole': ClusterRoleOverview,
    'namespaces': NamespaceOverview,
    'namespace': NamespaceOverview,
    'customresourcedefinitions': CrdOverview,
    'crd': CrdOverview,
    'ingressclasses': IngressClassOverview,
    'ingressclass': IngressClassOverview,
    'secrets': SecretOverview,
    'secret': SecretOverview,
    'storageclasses': StorageClassOverview,
    'storageclass': StorageClassOverview,
    'networkpolicies': NetworkPolicyOverview,
    'networkpolicy': NetworkPolicyOverview,
    'serviceaccounts': ServiceAccountOverview,
    'serviceaccount': ServiceAccountOverview,
    'persistentvolumes': PvOverview,
    'pv': PvOverview,
    'rolebindings': RoleBindingOverview,
    'rolebinding': RoleBindingOverview,
    'clusterrolebindings': ClusterRoleBindingOverview,
    'clusterrolebinding': ClusterRoleBindingOverview,
    'daemonsets': DaemonSetOverview,
    'daemonset': DaemonSetOverview,
    'jobs': JobOverview,
    'job': JobOverview,
    'horizontalpodautoscalers': HpaOverview,
    'hpa': HpaOverview,
    'replicasets': ReplicaSetOverview,
    'replicaset': ReplicaSetOverview,
    'replicationcontrollers': ReplicationControllerOverview,
    'replicationcontroller': ReplicationControllerOverview,
    'events': EventOverview,
    'event': EventOverview,
};

/**
 * Registry Pattern for Resource Details.
 * Maps kind to specific Overview component or Fallback.
 * Standard naming: <KIND_NAME>-overview.jsx
 */
export function getResourceComponent(kind) {
    const key = (kind || '').toLowerCase().replace(/-/g, '');
    return REGISTRY[key] || GenericDetails;
}
