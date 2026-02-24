{{/*
Expand the name of the chart.
*/}}
{{- define "k-view.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "k-view.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "k-view.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "k-view.labels" -}}
helm.sh/chart: {{ include "k-view.chart" . }}
{{ include "k-view.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "k-view.selectorLabels" -}}
app.kubernetes.io/name: {{ include "k-view.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "k-view.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "k-view.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Create secret name for Google OIDC and Static Users
*/}}
{{- define "k-view.secretName" -}}
{{- if .Values.secrets.existingSecret -}}
{{- .Values.secrets.existingSecret -}}
{{- else -}}
{{- include "k-view.fullname" . }}-secret
{{- end -}}
{{- end }}

{{/*
Common environment variables
*/}}
{{- define "k-view.commonEnv" -}}
- name: APP_VERSION
  value: {{ .Values.image.tag | default .Chart.AppVersion | quote }}
- name: GIN_MODE
  value: {{ .Values.env.ginMode | quote }}
- name: TZ
  value: {{ .Values.env.timezone | quote }}
- name: RBAC_CONFIG_PATH
  value: "/etc/kview/rbac/assignments.yaml"
- name: KVIEW_AUTHORIZED_USERS
  value: {{ include "k-view.authorizedUsers" . | quote }}
- name: KVIEW_ENABLE_SSO
  value: {{ .Values.enable_sso | quote }}
{{- end }}

{{/*
Calculate authorized users list from assignments and local users
*/}}
{{- define "k-view.authorizedUsers" -}}
{{- $users := list -}}
{{- range .Values.rbac.assignments -}}
  {{- if .user -}}
    {{- if typeIs "[]interface {}" .user -}}
      {{- range .user -}}
        {{- $users = append $users . -}}
      {{- end -}}
    {{- else -}}
      {{- $users = append $users .user -}}
    {{- end -}}
  {{- end -}}
{{- end -}}
{{- range .Values.localUsers -}}
  {{- $users = append $users .username -}}
{{- end -}}
{{- $users | compact | uniq | join "," -}}
{{- end -}}
