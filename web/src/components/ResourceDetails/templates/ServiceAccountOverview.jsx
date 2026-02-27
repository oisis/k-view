import React from 'react';
import DetailSection from '../DetailSection';
import SecretsTable from '../SecretsTable';
import ImagePullSecretsTable from '../ImagePullSecretsTable';

export default function ServiceAccountOverview({ data, metadata, namespace, t }) {
    // In native K8s objects, secrets and imagePullSecrets are at the root level of the data object
    const secrets = data?.secrets || [];
    const imagePullSecrets = data?.imagePullSecrets || [];

    return (
        <>
            {secrets.length > 0 && <SecretsTable secrets={secrets} namespace={namespace} t={t} />}
            {imagePullSecrets.length > 0 && <ImagePullSecretsTable imagePullSecrets={imagePullSecrets} namespace={namespace} t={t} />}
        </>
    );
}
