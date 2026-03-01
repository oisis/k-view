import React from 'react';
import IngressRulesTable from '../IngressRulesTable';

export default function IngressOverview({ data, metadata, spec, status, t }) {
    return (
        <>
            {spec?.rules && <IngressRulesTable spec={spec} t={t} />}
        </>
    );
}
