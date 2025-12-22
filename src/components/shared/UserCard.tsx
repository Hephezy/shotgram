import { Link } from 'react-router-dom';
import { Button } from '../ui/button';
import { IUser } from '@/types';
import { useFollowUser, useUnfollowUser, useGetFollowStatus } from '@/lib/react-query/queriesAndMutations';
import Loader from './Loader';

type UserCardProps = {
    user: IUser;
};

const UserCard = ({ user }: UserCardProps) => {
    const { data: followStatus, isLoading: isStatusLoading } = useGetFollowStatus(user.id);
    const { mutate: followUser, isPending: isFollowing } = useFollowUser();
    const { mutate: unfollowUser, isPending: isUnfollowing } = useUnfollowUser();

    const handleFollowClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (followStatus?.isFollowing) {
            unfollowUser(user.id);
        } else {
            followUser(user.id);
        }
    };

    const isLoading = isFollowing || isUnfollowing || isStatusLoading;

    return (
        <Link
            to={`/profile/${user.id}`}
            className='user-card'
        >
            <img
                src={user.imageUrl || "/assets/icons/profile-placeholder.svg"}
                alt="profile"
                className='rounded-full w-14 h-14'
            />

            <div className='flex flex-col gap-1'>
                <h2 className='base-medium text-light-1 text-center line-clamp-1'>
                    {user.name}
                </h2>
                <h3 className='small-regular text-light-3 text-center line-clamp-1'>
                    @{user.username}
                </h3>
            </div>

            <Button
                type="button"
                size="sm"
                className={`px-5 ${followStatus?.isFollowing ? 'shad-button_dark_4' : 'shad-button_primary'}`}
                onClick={handleFollowClick}
                disabled={isLoading}
            >
                {isLoading ? (
                    <Loader />
                ) : followStatus?.isFollowing ? (
                    'Following'
                ) : (
                    'Follow'
                )}
            </Button>
        </Link>
    )
}

export default UserCard;