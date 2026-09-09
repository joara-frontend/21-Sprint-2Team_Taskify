import Avatar from "@/components/common/Avatar";
import BaseButton from "@/components/common/Button/ButtonBase";
import { useAuth } from "@/contexts/AuthProvider";
import { CommentItemType } from "@/types/comment.type";
import { formatToDisplayDate } from "@/utils/formatDate";
import React, { ChangeEvent, useState } from "react";

interface CommentActionProps {
  onUpdate: (commentId: number, content: string) => Promise<void>;
  onDelete: (commentId: number) => Promise<void>;
}

interface CommentItemProps {
  comment: CommentItemType;
  commentActions: CommentActionProps;
  isSubmitting: boolean;
}

export default function CommentItem({
  comment,
  commentActions,
  isSubmitting,
}: CommentItemProps) {
  const { user } = useAuth();

  const { onUpdate, onDelete } = commentActions;
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");

  const handleChangeInput = (e: ChangeEvent<HTMLInputElement>) => {
    setEditContent(e.target.value);
  };

  const handleSave = async () => {
    if (isSubmitting) return;

    try {
      await onUpdate(comment.id, editContent);
      setIsEditing(false);
    } catch {
      console.log("댓글 저장 실패");
    }
  };

  return (
    <li className="flex gap-[8px] tablet:gap-[12px]">
      <Avatar
        nickname={comment.author.nickname}
        imageUrl={comment.author.profileImageUrl}
        className="min-w-[26px] h-[26px] tablet:min-w-[34px] tablet:h-[34px]"
      />
      <div className="flex-grow pt-[6px] tablet:pt-0">
        <div className="flex items-center gap-[8px] mb-[8px] tablet:mb-0">
          <div className="text-xs tablet:text-md font-semibold text-black-medium">
            {comment.author.nickname}
          </div>
          <div className="text-[10px] tablet:text-xs font-regular text-gray-medium">
            {formatToDisplayDate(comment.updatedAt)}
          </div>
        </div>
        <div className="w-full text-xs tablet:text-md font-regular text-black-medium">
          {isEditing ? (
            <>
              <input
                type="text"
                value={editContent}
                className="w-full !border-none !px-0 !py-0 outline-none focus:outline-none"
                onChange={handleChangeInput}
                autoFocus
              />
            </>
          ) : (
            <>{comment.content}</>
          )}
        </div>
        {user && user.id === comment.author.id && (
          <div className="flex gap-[8px] tablet:gap-[12px] mt-[8px] tablet:mt-[10px]">
            {isEditing ? (
              <>
                <BaseButton
                  type="button"
                  className="text-[10px] tablet:text-xs font-regular text-gray-medium underline"
                  onClick={handleSave}
                  disabled={isSubmitting}
                >
                  저장
                </BaseButton>
                <BaseButton
                  type="button"
                  className="text-[10px] tablet:text-xs font-regular text-gray-medium underline"
                  onClick={() => setIsEditing(false)}
                  disabled={isSubmitting}
                >
                  취소
                </BaseButton>
              </>
            ) : (
              <>
                <BaseButton
                  type="button"
                  className="text-[10px] tablet:text-xs font-regular text-gray-medium underline"
                  onClick={() => {
                    setEditContent(comment.content);
                    setIsEditing(true);
                  }}
                  disabled={isSubmitting}
                >
                  수정
                </BaseButton>
                <BaseButton
                  type="button"
                  className="text-[10px] tablet:text-xs font-regular text-gray-medium underline"
                  onClick={() => onDelete(comment.id)}
                  disabled={isSubmitting}
                >
                  삭제
                </BaseButton>
              </>
            )}
          </div>
        )}
      </div>
    </li>
  );
}
