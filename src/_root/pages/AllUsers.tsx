import Loader from '@/components/shared/Loader';
import UserCard from '@/components/shared/UserCard';
import { useToast } from '@/components/ui/use-toast';
import { useUserContext } from '@/context/AuthContext';
import { useGetUsers } from '@/lib/react-query/queriesAndMutations';
import { IUser } from '@/types';
import { useEffect } from 'react';

const AllUsers = () => {
  const { user } = useUserContext();
  const { data: creators, isLoading: isUserLoading, isError: isErrorCreators } = useGetUsers();
  const { toast } = useToast();

  useEffect(() => {
    if (isErrorCreators) {
      toast({ title: "Something went wrong." });
    }
  }, [isErrorCreators, toast]);

  if (isErrorCreators) return null;

  // Filter out the current user from the list
  const filteredUsers = creators?.documents.filter(
    (creator: IUser) => creator.id !== user.id
  );

  return (
    <div className="common-container">
      <div className="user-container">
        <h2 className="h3-bold md:h2-bold text-left w-full">All Users</h2>

        {isUserLoading ? (
          <Loader />
        ) : (
          <ul className='user-grid'>
            {filteredUsers?.map((creator: IUser) => (
              <li key={creator.id} className="flex-1 min-w-[200px] w-full">
                <UserCard user={creator} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AllUsers;