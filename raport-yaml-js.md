# K-View Compatibility Report: YAML vs Code

Generated on: 2026-03-05

## CLUSTER-ROLE-BINDINGS
✅ **List View:** 100% Zgodności
- **Sekcje w YAML:** Metadata, Role References, Subjects

---

## CLUSTER-ROLES
✅ **List View:** 100% Zgodności
- **Sekcje w YAML:** Metadata, Rules

---

## CONFIGMAPS
✅ **List View:** 100% Zgodności
- **Sekcje w YAML:** Metadata, Data

---

## CRONJOBS
✅ **List View:** 100% Zgodności
- **Sekcje w YAML:** Metadata, Resource Info, Active Jobs, Inactive Jobs

---

## CUSTOMRESOURCEDEFINITION
✅ **List View:** 100% Zgodności
- **Sekcje w YAML:** Metadata, Resource Info, Accepted Names, Objects, Versions, Conditions

---

## DAEMONSETS
✅ **List View:** 100% Zgodności
- **Sekcje w YAML:** Metadata, Resource Info, Pods status, Pods, Services

---

## DEPLOYMENTS
✅ **List View:** 100% Zgodności
- **Sekcje w YAML:** Metadata, Resource Info, Rolling update strategy, Conditions, New Replica Set, Old Replica Set, Horizontal Pod Autoscalers

---

## ENDPOINTS
✅ **List View:** 100% Zgodności
- **Sekcje w YAML:** Metadata, Resource Info

---

## HORIZONTALPODAUTOSCALER
✅ **List View:** 100% Zgodności
- **Sekcje w YAML:** Metadata, Metrics, Scale Target Ref

---

## INGRESS-CLASSES
✅ **List View:** 100% Zgodności
- **Sekcje w YAML:** Metadata, Specification

---

## INGRESSES
✅ **List View:** 100% Zgodności
- **Sekcje w YAML:** Metadata, Rules

---

## JOBS
✅ **List View:** 100% Zgodności
- **Sekcje w YAML:** Metadata, Resource Info, Conditions, Pods status, Pods

---

## NAMESPACES
✅ **List View:** 100% Zgodności
- **Sekcje w YAML:** Metadata, Resource Info, Resource Quotas, Resource Limits

---

## NETWORK-POLICIES
✅ **List View:** 100% Zgodności
- **Sekcje w YAML:** Metadata, Resource Info, Ingress Rules (Incoming Traffic), Egress Rules (Outgoing Traffic)

---

## NODES
- ❌ **Brakuje w UI:** Name, Labels, Ready, CPU requests (cores), CPU limits (cores), CPU capacity (cores), RAM requests, RAM limits, RAM capacity, Pods, Create
- **Sekcje w YAML:** Metadata, Resource Info, System Information, Allocation, Conditions, Pods

---

## PERSISTENTVOLUME
✅ **List View:** 100% Zgodności
- **Sekcje w YAML:** Metadata, Resource Info, Source, Capacity

---

## PERSISTENTVOLUMECLAIM
✅ **List View:** 100% Zgodności
- **Sekcje w YAML:** Metadata, Resource Info

---

## PODS
✅ **List View:** 100% Zgodności
- **Sekcje w YAML:** Metadata, Resource Info, Controlled by, Persistent Volume Claims, Containers

---

## REPLICASETS
✅ **List View:** 100% Zgodności
- **Sekcje w YAML:** Metadata, Resource Info, Pods Status, Pods, Services

---

## REPLICATIONCONTROLLERS
- ❌ **Brakuje w UI:** Ready, Current, Desired
- ⚠️ **Nadmiarowe w UI:** Pods
- **Sekcje w YAML:** Metadata, Pods, Services, Status Conditions

---

## ROLE-BINDINGS
✅ **List View:** 100% Zgodności
- **Sekcje w YAML:** Metadata, Role References, Subjects

---

## ROLES
✅ **List View:** 100% Zgodności
- **Sekcje w YAML:** Metadata, Rules

---

## SECRETS
✅ **List View:** 100% Zgodności
- **Sekcje w YAML:** Metadata, Data

---

## SERVICE-ACCOUNTS
✅ **List View:** 100% Zgodności
- **Sekcje w YAML:** Metadata, Secrets, Image Pull Secrets

---

## SERVICES
- ❌ **Brakuje w UI:** Int Endpoints, Ext Endpoints
- ⚠️ **Nadmiarowe w UI:** Internal Endpoints, External Endpoints
- **Sekcje w YAML:** Metadata, Resource Info, Endpoints, Pods, Ingresses

---

## STATEFULSETS
✅ **List View:** 100% Zgodności
- **Sekcje w YAML:** Metadata, Resource Info, Pods status, Pods

---

