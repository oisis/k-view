import React from 'react';
import CommonTable from '../../Common/CommonTable';
import ExpandableCell from '../ExpandableCell';
import { useTheme } from '../../../ThemeContext';

export default function RoleOverview({ data, metadata, spec, t, isBinding = false }) {
    const { icons: themeIcons } = useTheme();
    const rules = data?.rules || spec?.rules || [];

    const ruleColumns = [
        { header: 'Resources', accessor: (r) => <ExpandableCell value={r.resources || []} type="resources" icons={themeIcons} /> },
        { header: 'Non-resource URL', accessor: (r) => <ExpandableCell value={r.nonResourceURLs || []} type="urls" icons={themeIcons} /> },
        { header: 'Resource Names', accessor: (r) => <ExpandableCell value={r.resourceNames || []} type="names" icons={themeIcons} /> },
        { header: 'Verbs', accessor: (r) => <ExpandableCell value={r.verbs || []} type="verbs" icons={themeIcons} /> },
        { header: 'API Groups', accessor: (r) => <ExpandableCell value={r.apiGroups || []} type="groups" icons={themeIcons} /> }
    ];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <CommonTable title="Rules" columns={ruleColumns} data={rules} t={t} />
        </div>
    );
}
