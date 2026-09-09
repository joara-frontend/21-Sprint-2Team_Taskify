import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CardDetailType, TagItem } from "@/types/card.type";
import { getCard } from "@/api/cards.api";
import { getTagColor } from "@/utils/getTagColor";
import { CommentCreateType, CommentItemType } from "@/types/comment.type";
import {
  deleteComments,
  getComments,
  postComments,
  putComments,
} from "@/api/comments.api";
import { useIsMountedRef } from "@/hooks/useIsMountedRef";
import useInfiniteScroll from "@/hooks/useInfiniteScroll";
import { useParams } from "next/navigation";
import { CardCommentSchema, CardCommentValues } from "@/types/card.schema";
import { handleApiError } from "@/utils/handleError";

const SIZE = 5;

export function useCardDetail(cardId: number) {
  const [cardDetailData, setCardDetailData] = useState<CardDetailType | null>(
    null,
  );
  const [columnId, setColumnId] = useState<number | undefined>(undefined);

  const params = useParams();
  const dashboardId = Number(params?.id) ?? null;

  // 상세보기
  const getCardDetail = useCallback(
    async (cardId: number): Promise<CardDetailType | undefined> => {
      try {
        const res = await getCard(cardId);

        if (!res || !res.data) return;
        const nextCard: CardDetailType = res.data;
        setCardDetailData(nextCard);
        setColumnId(nextCard.columnId);
      } catch (error) {
        handleApiError(error, "카드 상세 조회 실패:");
      }
    },
    [],
  );

  const tagList: TagItem[] = useMemo(() => {
    if (!cardDetailData) return [];

    return cardDetailData.tags.map((tag) => {
      const colors = getTagColor(tag);
      return {
        name: tag,
        bgColor: colors.bgColor,
        fontColor: colors.fontColor,
      };
    });
  }, [cardDetailData]);

  // 댓글
  const {
    control,
    formState: { isValid },
    handleSubmit: handleSubmit,
    setValue,
    resetField,
  } = useForm<CardCommentValues>({
    resolver: zodResolver(CardCommentSchema),
    mode: "onChange",
    defaultValues: {
      cardId: cardId,
      columnId: columnId,
      dashboardId: dashboardId,
      content: "",
    },
  });

  const [commentList, setCommentList] = useState<CommentItemType[]>([]);
  const [cursorId, setCursorId] = useState<number | null>(null);
  const [hasNext, setHasNext] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const listScrollRef = useRef<HTMLDivElement | null>(null);
  const mountedRef = useIsMountedRef();
  const [isCreating, setIsCreating] = useState(false);
  const submittingCommentIdRef = useRef<number | null>(null);
  const [submittingCommentId, setSubmittingCommentId] = useState<number | null>(
    null,
  );

  const setSubmitting = useCallback((id: number | null) => {
    submittingCommentIdRef.current = id;
    setSubmittingCommentId(id);
  }, []);

  // 댓글 목록
  useEffect(() => {
    const fetchData = async () => {
      if (cardId) {
        await getCardDetail(cardId);
      }
    };

    fetchData();

    (async () => {
      setLoading(true);
      try {
        const res = await getComments(cardId, SIZE, null);

        if (!mountedRef.current) return;

        setCommentList(res.data.comments);
        setCursorId(res.data.cursorId);
        setHasNext(Boolean(res.data.cursorId) && res.data.comments.length > 0);
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    })();
  }, [cardId, getCardDetail, mountedRef, setValue]);

  const loadMore = useCallback(async () => {
    if (!hasNext || loadingMore) return;

    setLoadingMore(true);
    try {
      const res = await getComments(cardId, SIZE, cursorId);

      if (!mountedRef.current) return;

      setCommentList((prev) => [...prev, ...res.data.comments]);
      setCursorId(res.data.cursorId);
      setHasNext(Boolean(res.data.cursorId) && res.data.comments.length > 0);
    } finally {
      if (mountedRef.current) setLoadingMore(false);
    }
  }, [hasNext, loadingMore, cursorId, cardId, mountedRef]);

  const sentinelRef = useInfiniteScroll(
    loadMore,
    hasNext && !loadingMore,
    listScrollRef,
  );

  // 댓글 추가
  const onSubmit = async (data: CommentCreateType) => {
    if (isCreating) return;

    try {
      setIsCreating(true);
      const res = await postComments(data);

      if (res) {
        const nextComment = res;
        setCommentList((prev) => [nextComment, ...prev]);
        resetField("content");
      }
    } catch (error) {
      handleApiError(error, "댓글 추가 실패:");
    } finally {
      setIsCreating(false);
    }
  };

  // 댓글 수정
  const UpdateComment = useCallback(
    async (commentId: number, content: string) => {
      if (!content.trim()) return;
      if (submittingCommentIdRef.current === commentId) return;

      try {
        setSubmitting(commentId);
        const res = await putComments(commentId, content);

        if (res) {
          const nextComment = res;
          setCommentList((prev) =>
            prev.map((comment) =>
              comment.id === commentId ? nextComment : comment,
            ),
          );
        }
      } catch (error) {
        handleApiError(error, "댓글 수정 실패:");
      } finally {
        setSubmitting(null);
      }
    },
    [setSubmitting],
  );

  // 댓글 삭제
  const DeleteComment = useCallback(
    async (commentId: number) => {
      if (!commentId) return;
      if (submittingCommentIdRef.current === commentId) return;

      try {
        setSubmitting(commentId);
        const res = await deleteComments(commentId);

        if (res.status === 204 || res.status === 200) {
          setCommentList((prev) =>
            prev.filter((comment) => comment.id !== commentId),
          );
          return;
        }
      } catch (error) {
        handleApiError(error, "댓글 삭제 조회 실패:");
      } finally {
        setSubmitting(null);
      }
    },
    [setSubmitting],
  );

  useEffect(() => {
    if (columnId !== undefined) {
      setValue("columnId", columnId, { shouldValidate: true });
    }
  }, [columnId, setValue]);

  useEffect(() => {
    if (dashboardId !== null) {
      setValue("dashboardId", dashboardId, { shouldValidate: true });
    }
  }, [dashboardId, setValue]);

  const commentActions = useMemo(
    () => ({
      onUpdate: UpdateComment,
      onDelete: DeleteComment,
    }),
    [UpdateComment, DeleteComment],
  );

  return {
    cardProps: {
      cardDetailData,
      tagList,
    },
    listProps: {
      commentList,
      loading,
      loadingMore,
      sentinelRef,
    },
    formProps: {
      control,
      isValid,
      isCreating,
      submittingCommentId,
      onFormSubmit: handleSubmit,
      onSubmit,
    },
    commentActions,
  };
}
