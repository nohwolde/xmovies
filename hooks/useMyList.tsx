import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import Msg from "../components/Msg";
import { addToMyList, removeFromList } from "../redux/actions/myListAction";
import { MediaItem, MediaType, getMediaType, getTitle } from "../lib/tmdb";
import { usePersistedState } from "./usePersistedState";

export function useMyList(item: MediaItem | null | undefined, mediaType?: MediaType) {
  const dispatch = useDispatch();
  const { value: myList, ready } = usePersistedState<any[]>("MyList", []);
  const inList = !!item && myList.some((entry) => entry.id == item.id);

  const toggle = () => {
    // Until rehydrated, inList is unknown and adding could duplicate an entry
    if (!item || !ready) return;
    const title = getTitle(item);
    if (inList) {
      dispatch(removeFromList(item.id));
      toast.error(<Msg title={title} message="Was removed from your list" />, { theme: "dark" });
    } else {
      dispatch(
        addToMyList({
          id: item.id,
          title,
          poster_path: item.poster_path,
          backdrop_path: item.backdrop_path,
          overview: item.overview,
          vote_average: item.vote_average,
          release_date: item.release_date,
          first_air_date: item.first_air_date,
          media_type: getMediaType(item, mediaType),
          time: Date.now(),
        })
      );
      toast.success(<Msg title={title} message="Was added to your list" />, { theme: "dark" });
    }
  };

  return { inList, toggle };
}
