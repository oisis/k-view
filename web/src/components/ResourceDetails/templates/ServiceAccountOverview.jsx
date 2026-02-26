import React from 'react';
import DetailSection from '../DetailSection';
import SecretsTable from '../SecretsTable';
import ImagePullSecretsTable from '../ImagePullSecretsTable';

export default function ServiceAccountOverview({ data, metadata, namespace, t }) {
    return (
        <>
            {data.secrets && <SecretsTable secrets={data.secrets} namespace={namespace} t={t} />}
            {data.imagePullSecrets && <ImagePullSecretsTable imagePullSecrets={data.imagePullSecrets} namespace={namespace} t={t} />}
        </>
    );
}
