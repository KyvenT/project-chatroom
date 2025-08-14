import type { BidirectionalGroupedMap } from "../lib/bidirectionGroupedMap";

interface MemberStatusList {
    memberStatusMap: BidirectionalGroupedMap<{userId: string; username: string;}, string>;
    status: string;
}

const MemberStatusList = ({memberStatusMap, status}: MemberStatusList) => {
    return (
        <>
            {memberStatusMap.getByValueAsArray(status)?.map((member) => 
                <li key={member.userId}>
                    <p>{member.username}</p>
                </li>)}
        </>
    )
}

export default MemberStatusList;